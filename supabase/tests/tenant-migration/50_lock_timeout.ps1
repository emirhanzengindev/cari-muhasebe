# T6: lock_timeout = 5s and lock behaviour of the forward migration and the
# rollback. LOCAL TEST DATABASE ONLY, on its own run:
#   .\prepare_local.ps1 ; .\run_stage.ps1 -Stage T0 ; .\50_lock_timeout.ps1
#
#   L1  a reader holds ACCESS SHARE on categories      -> migration aborts with 55P03 after ~5 s, no trace
#   L2  a writer holds ROW EXCLUSIVE on invoices       -> migration aborts with 55P03 after ~5 s, no trace
#   L3  migration holds its locks for 8 extra seconds (a COPY of the file with
#       pg_sleep before COMMIT, generated outside the repo):
#         read safes      -> not blocked (SHARE ROW EXCLUSIVE allows reads)
#         read invoices   -> waits for COMMIT (ACCESS EXCLUSIVE: its policies are altered)
#         read categories -> waits for COMMIT (ACCESS EXCLUSIVE)
#         insert banks with the user id (old build) -> waits, then lands at the company id
#         insert invoices -> waits for COMMIT
#       no deadlock anywhere
#   L4  a reader holds ACCESS SHARE on cheques         -> rollback aborts with 55P03 after ~5 s, not applied
#   L5  rollback without blocker                       -> succeeds
# The repo migration and rollback files are not modified.

. (Join-Path $PSScriptRoot 'lib.ps1')
Assert-LocalContainer
Assert-LocalMarker

$tmp = Join-Path $script:LocalProject 'tmp'
New-Item -ItemType Directory -Force $tmp | Out-Null
$results = New-Object System.Collections.Generic.List[object]

function New-ContainerSql([string]$Name, [string]$Content) {
    $p = Join-Path $tmp $Name
    [IO.File]::WriteAllText($p, $Content, (New-Object System.Text.UTF8Encoding($false)))
    Copy-ToContainer $p $Name
}

function Add-Result([string]$Scenario, [string]$Check, [bool]$Ok, [string]$Detail) {
    $results.Add([pscustomobject]@{ Scenario = $Scenario; Check = $Check; Ok = $Ok; Detail = $Detail })
    $mark = if ($Ok) { 'OK  ' } else { 'FAIL' }
    Write-Host ("  [{0}] {1} {2}: {3}" -f $mark, $Scenario, $Check, $Detail)
}

function Invoke-Query([string]$Sql) {
    $cp = New-ContainerSql 'q.sql' $Sql
    $r = Invoke-Native 'docker' "exec $script:Container psql -U postgres -d postgres -X -A -t -v ON_ERROR_STOP=1 -f $cp"
    if ($r.ExitCode -ne 0) { throw "query failed: $($r.StdErr)" }
    $r.StdOut.Trim()
}

function Wait-Lock([string]$Rel, [string]$Mode, [string]$App) {
    $sql = "SELECT count(*) FROM pg_locks l JOIN pg_class c ON c.oid = l.relation JOIN pg_stat_activity a ON a.pid = l.pid " +
           "WHERE c.relname = '$Rel' AND l.mode = '$Mode' AND l.granted AND a.application_name = '$App';"
    for ($i = 0; $i -lt 60; $i++) {
        if ([int](Invoke-Query $sql) -gt 0) { return }
        Start-Sleep -Milliseconds 250
    }
    throw "Timed out waiting for $App to hold $Mode on $Rel"
}

function Stop-TestSessions {
    Invoke-Query "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE application_name LIKE 'tt\_%' AND pid <> pg_backend_pid();" | Out-Null
}

function Get-TimingMs([string]$Text) {
    $ms = [regex]::Matches($Text, 'Time: ([0-9]+[.,][0-9]+) ms') | ForEach-Object { [double]($_.Groups[1].Value -replace ',', '.') }
    if ($ms) { ($ms | Measure-Object -Maximum).Maximum } else { $null }
}

function Test-AbortsOnLock([string]$Scenario, [string]$Rel, [string]$BlockSql, [string]$Mode, [string]$FileInContainer) {
    $blocker = New-ContainerSql "blocker_$Scenario.sql" ("SET application_name = 'tt_blocker';`nBEGIN;`n$BlockSql`nSELECT pg_sleep(30);`nROLLBACK;`n")
    $b = Start-Native 'docker' "exec $script:Container psql -U postgres -d postgres -X -f $blocker"
    Wait-Lock $Rel $Mode 'tt_blocker'
    $wrapper = New-ContainerSql "run_$Scenario.sql" ("\set ON_ERROR_STOP on`n\set VERBOSITY verbose`n\timing on`nSET application_name = 'tt_migration';`n\i $FileInContainer`n")
    $w = [System.Diagnostics.Stopwatch]::StartNew()
    $r = Invoke-Native 'docker' "exec $script:Container psql -U postgres -d postgres -X -f $wrapper"
    $w.Stop()
    Stop-TestSessions
    $b.Process.WaitForExit(10000) | Out-Null
    $all = $r.StdOut + "`n" + $r.StdErr
    Write-Log "==== $Scenario" $r
    $sec = $w.Elapsed.TotalSeconds
    $lockMs = Get-TimingMs (($all -split 'ERROR')[0])
    Add-Result $Scenario 'aborted' ($r.ExitCode -ne 0) "exit=$($r.ExitCode)"
    Add-Result $Scenario 'SQLSTATE 55P03 lock timeout' ($all -match '55P03' -and $all -match 'lock timeout') (($all -split "`r?`n" | Where-Object { $_ -match 'ERROR' }) -join ' / ')
    Add-Result $Scenario 'waited ~5 s (4.8-9.0 s wall clock incl. docker/psql start)' ($sec -ge 4.8 -and $sec -le 9.0) ("{0:n2} s; longest successful statement {1} ms" -f $sec, $lockMs)
    Add-Result $Scenario 'no deadlock' ($all -notmatch 'deadlock') ''
}

# Preconditions: T0 done, migration not applied yet
if ((Invoke-Query "SELECT (EXISTS (SELECT 1 FROM tenant_test.fingerprint WHERE stage = 'T0') AND to_regnamespace('backup') IS NULL)::text;") -ne 'true') {
    throw 'Run on a fresh database: prepare_local.ps1, run_stage.ps1 -Stage T0, then this script'
}
$fwd = Copy-ToContainer $script:ForwardSql 'forward.sql'
$rb = Copy-ToContainer $script:RollbackSql 'rollback.sql'

Write-Host 'L1: reader holds ACCESS SHARE on categories'
Test-AbortsOnLock 'L1' 'categories' 'SELECT count(*) FROM public.categories;' 'AccessShareLock' $fwd
Invoke-LocalSqlFile (Join-Path $script:TestDir '52_assert_unchanged_since_t0.sql') | Out-Null
Add-Result 'L1' 'nothing changed (52)' $true 'schema, rows, users identical to T0'

Write-Host 'L2: writer holds ROW EXCLUSIVE on invoices'
Test-AbortsOnLock 'L2' 'invoices' 'LOCK TABLE public.invoices IN ROW EXCLUSIVE MODE;' 'RowExclusiveLock' $fwd
Invoke-LocalSqlFile (Join-Path $script:TestDir '52_assert_unchanged_since_t0.sql') | Out-Null
Add-Result 'L2' 'nothing changed (52)' $true 'schema, rows, users identical to T0'

Write-Host 'L3: migration keeps its locks 8 s longer; concurrent readers and writers'
$src = [IO.File]::ReadAllText($script:ForwardSql)
$i = $src.LastIndexOf('COMMIT;')
if ($i -lt 0) { throw 'COMMIT; not found in the forward migration' }
$paused = $src.Substring(0, $i) +
    "SELECT 'PAUSE_START=' || extract(epoch FROM clock_timestamp());`nSELECT pg_sleep(8);`n" +
    "SELECT 'PAUSE_END=' || extract(epoch FROM clock_timestamp());`n" + $src.Substring($i)
$pausedPath = New-ContainerSql 'forward_paused.sql' $paused
$wrapper = New-ContainerSql 'run_L3.sql' ("\set ON_ERROR_STOP on`n\set VERBOSITY verbose`nSET application_name = 'tt_migration';`n\i $pausedPath`n")
$m = Start-Native 'docker' "exec $script:Container psql -U postgres -d postgres -X -f $wrapper"
Wait-Lock 'safes' 'ShareRowExclusiveLock' 'tt_migration'
# make sure the pause has started (all row moves done, only the sleep is left)
for ($k = 0; $k -lt 80; $k++) {
    if ((Invoke-Query "SELECT count(*) FROM pg_stat_activity WHERE application_name = 'tt_migration' AND query LIKE '%pg_sleep(8)%';") -eq '1') { break }
    Start-Sleep -Milliseconds 250
}
$u1 = Invoke-Query "SELECT tenant_test.uid(1);"
$c1 = Invoke-Query "SELECT tenant_test.cid(1);"
# Timing is taken inside the database (clock_timestamp() right before and
# right after the statement), so docker/psql start-up time is not counted.
# The process stopwatch of Start-Native keeps running after exit and must not
# be used for durations.
$conc = @{
    'read safes'      = "SELECT 'RESULT=' || count(*) FROM public.safes;"
    'read invoices'   = "SELECT 'RESULT=' || count(*) FROM public.invoices;"
    'read categories' = "SELECT 'RESULT=' || count(*) FROM public.categories;"
    'insert banks'    = "SELECT 'RESULT=' || ok || ',' || COALESCE(result, state || ' ' || msg) FROM tenant_test.try_sql('authenticated', '$u1', 'current', `$q`$INSERT INTO public.banks (name, tenant_id) VALUES ('L3 banka', '$u1') RETURNING tenant_id::text`$q`$);"
    'insert invoices' = "SELECT 'RESULT=' || ok || ',' || COALESCE(result, state || ' ' || msg) FROM tenant_test.try_sql('authenticated', '$u1', 'current', `$q`$INSERT INTO public.invoices (tenant_id, invoice_number, total_amount) VALUES ('$c1', 'L3-INV', 1) RETURNING tenant_id::text`$q`$);"
}
$appNames = @{ 'read safes' = 'tt_r_safe'; 'read invoices' = 'tt_r_inv'; 'read categories' = 'tt_r_cat'; 'insert banks' = 'tt_w_bank'; 'insert invoices' = 'tt_w_inv' }
$procs = @{}
$n = 0
foreach ($k in $conc.Keys) {
    $n++
    $sql = "SET application_name = '$($appNames[$k])';`nSET lock_timeout = '30s';`n" +
           "SELECT 'START=' || extract(epoch FROM clock_timestamp());`n" + $conc[$k] + "`n" +
           "SELECT 'END=' || extract(epoch FROM clock_timestamp());`n"
    $cp = New-ContainerSql "conc_$n.sql" $sql
    $procs[$k] = Start-Native 'docker' "exec $script:Container psql -U postgres -d postgres -X -A -t -f $cp"
}
# Every concurrent session must have started its statement while the migration
# was still paused, otherwise the measurement says nothing.
for ($k = 0; $k -lt 40; $k++) {
    if ((Invoke-Query "SELECT count(*) FROM pg_stat_activity WHERE application_name IN ('tt_r_safe','tt_r_inv','tt_r_cat','tt_w_bank','tt_w_inv');") -eq '5') { break }
    Start-Sleep -Milliseconds 100
}
$m.Process.WaitForExit(60000) | Out-Null
$mSec = ($m.Process.ExitTime - $m.Process.StartTime).TotalSeconds
$mAll = $m.Out.Result + "`n" + $m.Err.Result
Write-Log '==== L3 migration (paused copy)' ([pscustomobject]@{ StdOut = $m.Out.Result; StdErr = $m.Err.Result })
Add-Result 'L3' 'migration committed' ($m.Process.ExitCode -eq 0 -and $mAll -match 'Migration OK') ("exit={0} {1:n1}s" -f $m.Process.ExitCode, $mSec)
# All times are the database clock (clock_timestamp()). The migration COMMITs
# right after PAUSE_END. A statement that started during the pause and ended
# before PAUSE_END was not blocked; one that ended after PAUSE_END waited for
# the COMMIT.
$pauseStart = if ($mAll -match 'PAUSE_START=([0-9.]+)') { [double]$Matches[1] } else { $null }
$pauseEnd = if ($mAll -match 'PAUSE_END=([0-9.]+)') { [double]$Matches[1] } else { $null }
Add-Result 'L3' 'pause timestamps captured' ([bool]($pauseStart -and $pauseEnd)) ("pause {0:n2} s" -f ($pauseEnd - $pauseStart))
foreach ($k in $procs.Keys) {
    $p = $procs[$k]
    $p.Process.WaitForExit(60000) | Out-Null
    $out = ($p.Out.Result + ' ' + $p.Err.Result)
    $start = if ($out -match 'START=([0-9.]+)') { [double]$Matches[1] } else { $null }
    $end = if ($out -match 'END=([0-9.]+)') { [double]$Matches[1] } else { $null }
    $res = if ($out -match 'RESULT=(\S+)') { $Matches[1] } else { $out.Trim() }
    $sec = if ($start -and $end) { $end - $start } else { -1 }
    $inPause = [bool]($start -and $pauseStart -and $pauseEnd -and $start -ge $pauseStart -and $start -lt $pauseEnd)
    $waited = [bool]($end -and $pauseEnd -and $end -ge $pauseEnd)
    $d = "statement {0:n2} s, started in pause={1}, ended after COMMIT={2}, {3}" -f $sec, $inPause, $waited, $res
    Write-Log ("==== L3 {0}: {1}" -f $k, $d) $null
    switch ($k) {
        'read safes'      { Add-Result 'L3' 'read safes not blocked (ended before COMMIT)' ($inPause -and -not $waited -and $res -match '^\d+$') $d }
        'read invoices'   { Add-Result 'L3' 'read invoices waited for COMMIT' ($inPause -and $waited -and $res -match '^\d+$') $d }
        'read categories' { Add-Result 'L3' 'read categories waited for COMMIT' ($inPause -and $waited -and $res -match '^\d+$') $d }
        'insert banks'    { Add-Result 'L3' 'insert banks waited, then landed at company id' ($inPause -and $waited -and $res -eq "true,$c1") $d }
        'insert invoices' { Add-Result 'L3' 'insert invoices waited for COMMIT, then accepted' ($inPause -and $waited -and $res -eq "true,$c1") $d }
    }
    if ($out -match 'deadlock') { Add-Result 'L3' "no deadlock ($k)" $false $out }
}
Add-Result 'L3' 'no deadlock (migration)' ($mAll -notmatch 'deadlock') ''

Write-Host 'L4: reader holds ACCESS SHARE on cheques during the rollback'
Test-AbortsOnLock 'L4' 'cheques' 'SELECT count(*) FROM public.cheques;' 'AccessShareLock' $rb
Add-Result 'L4' 'rollback not applied' ((Invoke-Query "SELECT (to_regprocedure('public.normalize_tenant_id()') IS NOT NULL AND to_regclass('backup.tenant_rollback_20261118_rows') IS NULL)::text;") -eq 'true') 'normalize_tenant_id() still present, no rollback report tables'

Write-Host 'L5: rollback without blocker'
$r5 = Invoke-LocalSqlFile $script:RollbackSql -Label 'L5 ROLLBACK'
Add-Result 'L5' 'rollback succeeded' ($r5.ExitCode -eq 0) ''

Stop-TestSessions
Write-Host ''
$results | Format-Table -AutoSize | Out-String -Width 250 | Write-Host
$bad = @($results | Where-Object { -not $_.Ok }).Count
Write-Log ("==== T6 summary: {0} checks, {1} failed" -f $results.Count, $bad) $null
if ($bad) { throw "T6: $bad checks failed. Log: $script:CurrentLog" }
Write-Host "T6 PASSED. Log: $script:CurrentLog"
