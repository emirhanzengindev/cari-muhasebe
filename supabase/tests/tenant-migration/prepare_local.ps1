# Builds (or rebuilds) the LOCAL test database from the live schema dump.
#   1. copies setup/*.sql into the separate local test project
#   2. `supabase db reset` there: empty database + roles, live public schema,
#      auth trigger, test harness (no test data)
#   3. verifies the restored schema and writes the local roles snapshot
# Touches only the local Docker database. Run again before every test run.

. (Join-Path $PSScriptRoot 'lib.ps1')

$migDir = Join-Path $script:LocalProject 'supabase\migrations'
$dump = Join-Path $migDir '00000000000001_live_public_schema.sql'
if (-not (Test-Path $dump)) { throw "Schema dump missing: $dump. Run .\dump_live_schema.ps1 first." }

$freeGb = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
if ($freeGb -lt 2) { throw "Only $freeGb GB free on C:. Free at least 2 GB before resetting the local database." }

Copy-Item (Join-Path $script:TestDir 'setup\*.sql') $migDir -Force
Get-ChildItem $migDir -Filter *.sql | Sort-Object Name | ForEach-Object { Write-Host "  migration: $($_.Name)" }

$cli = Get-SupabaseCli
$exe = $cli[0]; $pre = @($cli | Select-Object -Skip 1)
Push-Location $script:LocalProject
# Windows PowerShell 5.1 turns a native command's stderr (the CLI writes its
# progress there) into a terminating error under 'Stop'; judge by exit code.
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    & $exe @pre db reset --local 2>&1 | ForEach-Object { "$_" } |
        Where-Object { $_ -notmatch 'new version of Supabase CLI|recommend updating' } |
        ForEach-Object { Write-Host "  $_" }
    $resetExit = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $prevEap
    Pop-Location
}
if ($resetExit -ne 0) { throw "supabase db reset failed (exit $resetExit)" }

Assert-LocalMarker

# Restored schema = live object counts read on 2026-11-18
$check = Join-Path $env:TEMP 'tt_schema_check.sql'
Set-Content -Path $check -Encoding ascii -Value @'
\set ON_ERROR_STOP on
DO $$
DECLARE
  n_tab int := (SELECT count(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r');
  n_view int := (SELECT count(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'v');
  n_idx int := (SELECT count(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'i');
  n_fn int := (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace);
  n_pol int := (SELECT count(*) FROM pg_policies WHERE schemaname = 'public');
BEGIN
  RAISE NOTICE 'restored: tables=% views=% indexes=% functions=% policies=%', n_tab, n_view, n_idx, n_fn, n_pol;
  IF n_tab <> 18 OR n_view <> 2 OR n_idx <> 58 OR n_fn <> 39 THEN
    RAISE EXCEPTION 'Restored schema differs from live counts (tables 18, views 2, indexes 58, functions 39)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass) THEN
    RAISE EXCEPTION 'on_auth_user_created trigger missing';
  END IF;
END $$;
'@
Invoke-LocalSqlFile $check -Label 'schema check' | Out-Null

# Local roles snapshot (compare with compare_roles.ps1)
$ro = Join-Path $env:TEMP 'tt_roles_ro.sql'
Set-Content -Path $ro -Encoding ascii -Value ("SET default_transaction_read_only = on;`n\pset tuples_only on`n\pset format unaligned`n\pset fieldsep ' | '`n" + (Get-Content -Raw (Join-Path $script:TestDir '05_roles_and_privileges.sql')))
$r = Invoke-LocalSqlFile $ro -Label 'roles snapshot (local)'
$snapDir = Join-Path $script:LocalProject 'readonly'
New-Item -ItemType Directory -Force $snapDir | Out-Null
($r.StdOut -split "`r?`n" | Where-Object { $_ -match ' \| ' -and $_ -notmatch '^Field separator' }) | Set-Content (Join-Path $snapDir 'roles_local.txt') -Encoding utf8
Write-Host "Local database ready. Roles snapshot: $snapDir\roles_local.txt"
