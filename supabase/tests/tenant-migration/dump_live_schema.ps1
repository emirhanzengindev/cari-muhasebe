# READ-ONLY on live: schema-only pg_dump of the public schema into the separate
# local test project (outside this repository). Run it yourself, in an
# interactive terminal.
#
# Password handling
#   You type the password into pg_dump's own prompt (pg_dump -W reads the
#   terminal inside the container). It is never a command-line argument, never
#   an environment variable (host or container), never written to a file.
#   The Supabase CLI is NOT used: `supabase db dump` takes the password in the
#   --db-url argument (visible in the Windows process list) and exports it as
#   PGPASSWORD inside the script it runs in Docker (visible with docker
#   inspect while it runs); with PGPASSFILE it still exports PGPASSWORD.
#
# Connection
#   Session pooler, port 5432, user postgres.<project ref>, TLS.
#   -PoolerHost <host>   REQUIRED for live. Dashboard -> Connect -> Session
#                        pooler (aws-N-<region>.pooler.supabase.com).
#   -ProjectRef <ref>    REQUIRED for live. Dashboard -> Project Settings ->
#                        General -> Project ID (20 lowercase letters).
#   -SslRootCert <file>  REQUIRED for live. CA certificate from Dashboard ->
#                        Project Settings -> Database -> SSL Configuration ->
#                        Download certificate. Always sslmode=verify-full:
#                        the chain must lead to this CA and the server name
#                        must match -PoolerHost, or pg_dump refuses to connect
#                        (and never sends the password). There is no
#                        "require" fallback.
#
# What runs on live
#   One pg_dump session: --schema-only (no table data), REPEATABLE READ READ
#   ONLY transaction, ACCESS SHARE locks for a few seconds. No writes, no role
#   creation. Same pg_dump flags and sed filters as `supabase db dump`
#   (CLI 2.122.1 --dry-run), so the output matches what the CLI would produce.
#
# -SelfTestLocal
#   Runs the identical pipeline against the LOCAL test stack (local default
#   password "postgres", non-interactive) to check this script. No live access.
param(
    [string]$PoolerHost,
    [string]$ProjectRef,
    [string]$SslRootCert,
    [switch]$SelfTestLocal
)

. (Join-Path $PSScriptRoot 'lib.ps1')

$image = 'public.ecr.aws/supabase/postgres:17.11.0.006'   # pg_dump 17.11, already pulled for the local stack
$workDir = Join-Path $script:LocalProject 'tmp\dump'
New-Item -ItemType Directory -Force $workDir | Out-Null

if ($SelfTestLocal) {
    $outDir = $workDir
    $outName = 'selftest_local_schema.sql'
} else {
    # -cmatch: case-sensitive, culture-independent (see start_app.ps1)
    if ($PoolerHost -cnotmatch '^aws-[0-9]+-[a-z]+-[a-z]+-[0-9]+\.pooler\.supabase\.com$') {
        throw "Pass -PoolerHost exactly as shown in Dashboard -> Connect -> Session pooler (aws-N-<region>.pooler.supabase.com)"
    }
    if ($ProjectRef -cnotmatch '^[a-z]{20}$') {
        throw 'Pass -ProjectRef <project ref> (Dashboard -> Project Settings -> General -> Project ID, 20 lowercase letters)'
    }
    if (-not $SslRootCert -or -not (Test-Path -LiteralPath $SslRootCert -PathType Leaf)) {
        throw 'Pass -SslRootCert <path to the CA certificate downloaded from the Dashboard>. Live dumps use sslmode=verify-full only.'
    }
    $caText = Get-Content -LiteralPath $SslRootCert -Raw
    if ($caText -notmatch '-----BEGIN CERTIFICATE-----') {
        throw "$SslRootCert is not a PEM certificate file"
    }
    $outDir = Join-Path $script:LocalProject 'supabase\migrations'
    $outName = '00000000000001_live_public_schema.sql'
    if (Test-Path (Join-Path $outDir $outName)) { throw "Dump already exists: $outDir\$outName (delete it first to dump again)" }
}
if (-not (Test-Path (Join-Path $script:LocalProject 'supabase\config.toml'))) { throw "Local test project not found: $script:LocalProject" }

# pg_dump + sed pipeline, copied from `supabase db dump --dry-run` (CLI 2.122.1).
# Written to a file and mounted read-only, so no quoting passes through PowerShell.
$bash = @'
#!/usr/bin/env bash
set -euo pipefail
W=""
if [ "${TT_PROMPT:-0}" = "1" ]; then W="-W"; fi
pg_dump $W \
    --schema-only \
    --quote-all-identifier \
    --role "postgres" \
    --exclude-schema "" \
    --schema=public \
| sed -E 's/^\\(un)?restrict .*$/-- &/' \
| sed -E 's/^CREATE SCHEMA "/CREATE SCHEMA IF NOT EXISTS "/' \
| sed -E 's/^CREATE TABLE "/CREATE TABLE IF NOT EXISTS "/' \
| sed -E 's/^CREATE SEQUENCE "/CREATE SEQUENCE IF NOT EXISTS "/' \
| sed -E 's/^CREATE VIEW "/CREATE OR REPLACE VIEW "/' \
| sed -E 's/^CREATE FUNCTION "/CREATE OR REPLACE FUNCTION "/' \
| sed -E 's/^CREATE TRIGGER "/CREATE OR REPLACE TRIGGER "/' \
| sed -E 's/^CREATE PUBLICATION "supabase_realtime/-- &/' \
| sed -E 's/^CREATE EVENT TRIGGER /-- &/' \
| sed -E 's/^         WHEN TAG IN /-- &/' \
| sed -E 's/^   EXECUTE FUNCTION /-- &/' \
| sed -E 's/^ALTER EVENT TRIGGER /-- &/' \
| sed -E 's/^ALTER PUBLICATION "supabase_realtime_/-- &/' \
| sed -E 's/^ALTER FOREIGN DATA WRAPPER (.+) OWNER TO /-- &/' \
| sed -E 's/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/-- &/' \
| sed -E 's/^GRANT ALL ON FOREIGN DATA WRAPPER (.+) TO "postgres" WITH GRANT OPTION/-- &/' \
| sed -E "s/^GRANT (.+) ON (.+) \"()\"/-- &/" \
| sed -E "s/^REVOKE (.+) ON (.+) \"()\"/-- &/" \
| sed -E 's/^(CREATE EXTENSION IF NOT EXISTS "pg_tle").+/\1;/' \
| sed -E 's/^(CREATE EXTENSION IF NOT EXISTS "pgsodium").+/\1;/' \
| sed -E 's/^(CREATE EXTENSION IF NOT EXISTS "pgmq").+/\1;/' \
| sed -E 's/^COMMENT ON EXTENSION (.+)/-- &/' \
| sed -E 's/^CREATE POLICY "cron_job_/-- &/' \
| sed -E 's/^ALTER TABLE "cron"/-- &/' \
| sed -E 's/^SET transaction_timeout = 0;/-- &/' \
| sed -E "/^--/d" \
> "/out/${TT_OUT}.partial"
mv "/out/${TT_OUT}.partial" "/out/${TT_OUT}"
'@
[IO.File]::WriteAllText((Join-Path $workDir 'dump.sh'), ($bash -replace "`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))

$dockerArgs = @('run', '--rm')
if ($SelfTestLocal) {
    # local stack only: known local default password, no prompt
    $dockerArgs += @('-e', 'PGHOST=host.docker.internal', '-e', 'PGPORT=54322', '-e', 'PGUSER=postgres',
               '-e', 'PGPASSWORD=postgres', '-e', 'PGSSLMODE=disable', '-e', 'TT_PROMPT=0')
} else {
    $dockerArgs += @('-it', '-e', "PGHOST=$PoolerHost", '-e', 'PGPORT=5432', '-e', "PGUSER=postgres.$ProjectRef",
               '-e', 'TT_PROMPT=1')
    # verify-full only (checked above that the certificate exists and is PEM)
    $ca = (Resolve-Path -LiteralPath $SslRootCert).Path
    $dockerArgs += @('-e', 'PGSSLMODE=verify-full', '-e', 'PGSSLROOTCERT=/certs/ca.crt', '-v', "${ca}:/certs/ca.crt:ro")
}
$dockerArgs += @('-e', 'PGDATABASE=postgres', '-e', "TT_OUT=$outName",
           '-v', "${outDir}:/out", '-v', "${workDir}:/work:ro",
           '--entrypoint', 'bash', $image, '/work/dump.sh')

if (-not $SelfTestLocal) { Write-Host 'pg_dump will ask "Password:" - type the database password there (input hidden).' }
& docker @dockerArgs
if ($LASTEXITCODE -ne 0) {
    Remove-Item (Join-Path $outDir "$outName.partial") -ErrorAction SilentlyContinue
    throw "pg_dump failed (exit $LASTEXITCODE). Nothing was kept."
}

$out = Join-Path $outDir $outName
# Schema only: pg_dump writes table data only as "COPY ... FROM stdin;" blocks
$dataLines = Select-String -Path $out -Pattern '^COPY\s.+\sFROM\s+stdin;' -CaseSensitive:$false
if ($dataLines) {
    Remove-Item $out
    throw "Dump contained data statements ($($dataLines.Count)); file deleted. Nothing was kept."
}
$size = (Get-Item $out).Length
Write-Host ("Schema dump written: {0} ({1:n0} bytes)." -f $out, $size)
if (-not $SelfTestLocal) { Write-Host 'Next: .\prepare_local.ps1' }
