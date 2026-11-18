# Runs one test stage against the LOCAL test database. See run_order.md.
#   T0  seed (02, +03 with -Extended) and baseline checks (11)
#   T1  forward migration (repo file, unchanged) + checks (12)
#   T2  sign-ups, metadata edits, user activity (20, 21)
#   T3  negative tests, all rolled back (30)
#   T4  rollback (repo file, unchanged) + independent checks (14)
#   T5  second run of both files must abort; nothing may change (16)
# The forward and rollback files are copied into the container as they are;
# this script never edits them.
param(
    [Parameter(Mandatory)][ValidateSet('T0', 'T1', 'T2', 'T3', 'T4', 'T5')][string]$Stage,
    [switch]$Extended
)

. (Join-Path $PSScriptRoot 'lib.ps1')
Assert-LocalContainer
Assert-LocalMarker
$t = $script:TestDir

switch ($Stage) {
    'T0' {
        Invoke-LocalSqlFile (Join-Path $t '02_seed_baseline.sql') -User supabase_admin | Out-Null
        if ($Extended) { Invoke-LocalSqlFile (Join-Path $t '03_seed_extended.sql') -User supabase_admin | Out-Null }
        Invoke-LocalSqlFile (Join-Path $t '11_assert_t0.sql') | Out-Null
    }
    'T1' {
        Invoke-LocalSqlFile $script:ForwardSql -Label 'FORWARD MIGRATION' | Out-Null
        Invoke-LocalSqlFile (Join-Path $t '12_assert_t1.sql') | Out-Null
    }
    'T2' {
        Invoke-LocalSqlFile (Join-Path $t '20_signup_and_meta.sql') -User supabase_admin | Out-Null
        Invoke-LocalSqlFile (Join-Path $t '21_post_forward_activity.sql') | Out-Null
    }
    'T3' {
        Invoke-LocalSqlFile (Join-Path $t '30_negative_tests.sql') | Out-Null
    }
    'T4' {
        # The app run skips T2: take the pre-rollback capture here in that case.
        $pre = Join-Path $env:TEMP 'tt_capture_t2.sql'
        Set-Content -Path $pre -Encoding ascii -Value @'
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T2') THEN
    PERFORM tenant_test.capture('T2');
    RAISE NOTICE 'T2 capture taken right before the rollback';
  END IF;
END $$;
'@
        Invoke-LocalSqlFile $pre -Label 'pre-rollback capture' | Out-Null
        Invoke-LocalSqlFile $script:RollbackSql -Label 'ROLLBACK' | Out-Null
        Invoke-LocalSqlFile (Join-Path $t '14_assert_t4.sql') | Out-Null
    }
    'T5' {
        $f = Invoke-LocalSqlFile $script:ForwardSql -ExpectFailure -Label 'FORWARD MIGRATION (second run, must abort)'
        $r = Invoke-LocalSqlFile $script:RollbackSql -ExpectFailure -Label 'ROLLBACK (second run, must abort)'
        if (($r.StdOut + $r.StdErr) -notmatch 'rollback already ran') { throw 'Rollback rerun aborted for an unexpected reason (see log)' }
        if (($f.StdOut + $f.StdErr) -notmatch 'migration already ran') { throw 'Forward rerun aborted for an unexpected reason (see log)' }

        # Pre-flight guard: both files must abort before anything else when run
        # with JWT claims set (SQL Editor role impersonation) or as another role.
        $fwdIn = Copy-ToContainer $script:ForwardSql 'forward.sql'
        $rbIn = Copy-ToContainer $script:RollbackSql 'rollback.sql'
        $cases = @(
            @{ Name = 'claims';   Prefix = "SELECT set_config('request.jwt.claims', '{`"sub`": `"00000000-0000-0000-0000-000000000001`", `"role`": `"authenticated`"}', false);"; Expect = 'JWT claims are set' },
            @{ Name = 'set_role'; Prefix = 'SET ROLE authenticated;'; Expect = 'run as postgres' }
        )
        # session_user check: logged in as supabase_admin, effective role postgres
        $cases += @{ Name = 'session_user'; Prefix = 'SET ROLE postgres;'; Expect = 'session_user is supabase_admin'; User = 'supabase_admin' }
        foreach ($case in $cases) {
            foreach ($target in @(@{ Label = 'forward'; Path = $fwdIn }, @{ Label = 'rollback'; Path = $rbIn })) {
                $w = Join-Path $env:TEMP ("tt_guard_{0}_{1}.sql" -f $case.Name, $target.Label)
                Set-Content -Path $w -Encoding ascii -Value ($case.Prefix + "`n\i " + $target.Path + "`n")
                $user = if ($case.User) { $case.User } else { 'postgres' }
                $g = Invoke-LocalSqlFile $w -User $user -ExpectFailure -Label ("GUARD {0} with {1} (must abort)" -f $target.Label, $case.Name)
                if (($g.StdOut + $g.StdErr) -notmatch [regex]::Escape($case.Expect)) {
                    throw "Guard did not fire for $($target.Label) with $($case.Name) (see log)"
                }
            }
        }
        Invoke-LocalSqlFile (Join-Path $t '16_assert_t5.sql') | Out-Null
    }
}
Write-Host "Stage $Stage done. Log: $script:CurrentLog"
