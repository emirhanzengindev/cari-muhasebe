# Full backup (schema + data) of the public and auth schemas before a live
# migration. READ-ONLY on live. Run it yourself, in an interactive terminal
# (not the VS Code terminal: hidden password input looks frozen there).
#
#   .\backup_live_full.ps1 -PoolerHost <aws-N-region.pooler.supabase.com> -ProjectRef <project ref> -SslRootCert <ca.crt>
#   .\backup_live_full.ps1 -SelfTestLocal      # same pipeline against the local test stack
#
# The backup contains real customer data:
#   * it is written OUTSIDE the repository ($env:USERPROFILE\Desktop\cari1-backups
#     by default) and must never be committed, pushed or uploaded to GitHub;
#   * keep it on an encrypted disk (BitLocker) or in an encrypted archive.
#
# Password handling (same as tests/tenant-migration/dump_live_schema.ps1)
#   You type the password into pg_dump's own prompt (pg_dump -W reads the
#   terminal inside the container). It is never a command-line argument, an
#   environment variable or a file. The Supabase CLI is not used.
#
# Connection
#   Session pooler, port 5432, user postgres.<project ref>, sslmode=verify-full
#   with the CA certificate from Dashboard -> Database -> SSL Configuration.
#   No "require" fallback: a wrong certificate or host name means no
#   connection and the password is never sent.
#
# What runs on live
#   One pg_dump session (REPEATABLE READ, READ ONLY, ACCESS SHARE locks on the
#   dumped tables while it runs). No writes.
#
# Restore (only with a separate decision): pg_restore --list <file> shows the
# contents; a restore goes to a NEW/empty database first, never straight over
# the live one.
param(
    [string]$PoolerHost,
    [string]$ProjectRef,
    [string]$SslRootCert,
    [string]$OutDir = (Join-Path $env:USERPROFILE 'Desktop\cari1-backups'),
    [switch]$SelfTestLocal
)
$ErrorActionPreference = 'Stop'

$image = 'public.ecr.aws/supabase/postgres:17.11.0.006'   # pg_dump 17.11
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$workDir = Join-Path $env:TEMP 'cari1_backup_work'
New-Item -ItemType Directory -Force $workDir | Out-Null

if ($SelfTestLocal) {
    $OutDir = Join-Path $workDir 'selftest'
} else {
    # -cmatch: case-sensitive and culture-independent (tr-TR breaks [a-z] with -match)
    if ($PoolerHost -cnotmatch '^aws-[0-9]+-[a-z]+-[a-z]+-[0-9]+\.pooler\.supabase\.com$') {
        throw 'Pass -PoolerHost exactly as shown in Dashboard -> Connect -> Session pooler (aws-N-<region>.pooler.supabase.com)'
    }
    if ($ProjectRef -cnotmatch '^[a-z]{20}$') {
        throw 'Pass -ProjectRef <project ref> (Dashboard -> Project Settings -> General -> Project ID, 20 lowercase letters)'
    }
    if (-not $SslRootCert -or -not (Test-Path -LiteralPath $SslRootCert -PathType Leaf)) {
        throw 'Pass -SslRootCert <CA certificate file>. Live backups use sslmode=verify-full only.'
    }
    if ((Get-Content -LiteralPath $SslRootCert -Raw) -notmatch '-----BEGIN CERTIFICATE-----') {
        throw "$SslRootCert is not a PEM certificate file"
    }
}
# Checked before anything is created
$OutDir = [IO.Path]::GetFullPath($OutDir)
if (($OutDir.TrimEnd('\') + '\').StartsWith($repoRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing: -OutDir $OutDir is inside the repository. Backups contain customer data and must stay outside it."
}
New-Item -ItemType Directory -Force $OutDir | Out-Null
$outName = if ($SelfTestLocal) { 'selftest_local_full.dump' } else { 'live_full_{0}.dump' -f (Get-Date -Format 'yyyyMMdd-HHmmss') }

# pg_dump, then a content summary from the file itself (no data is printed)
$bash = @'
#!/usr/bin/env bash
set -euo pipefail
W=""
if [ "${TT_PROMPT:-0}" = "1" ]; then W="-W"; fi
pg_dump $W --format=custom --compress=6 --schema=public --schema=auth \
        --file="/out/${TT_OUT}.partial"
mv "/out/${TT_OUT}.partial" "/out/${TT_OUT}"
echo "== contents (pg_restore --list)"
pg_restore --list "/out/${TT_OUT}" > /tmp/toc.txt
echo "table data entries: $(grep -c ' TABLE DATA ' /tmp/toc.txt || true)"
for t in public.invoices public.invoice_items public.products public.stock_movements public.current_accounts public.current_account_movements auth.users; do
  s="${t%%.*}"; n="${t#*.}"
  if grep -q " TABLE DATA ${s} ${n} " /tmp/toc.txt; then echo "  data present: ${t}"; else echo "  MISSING DATA: ${t}"; fi
done
'@
[IO.File]::WriteAllText((Join-Path $workDir 'backup.sh'), ($bash -replace "`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))

$dockerArgs = @('run', '--rm')
if ($SelfTestLocal) {
    # local stack only: known local default password, no prompt
    $dockerArgs += @('-e', 'PGHOST=host.docker.internal', '-e', 'PGPORT=54322', '-e', 'PGUSER=postgres',
                     '-e', 'PGPASSWORD=postgres', '-e', 'PGSSLMODE=disable', '-e', 'TT_PROMPT=0')
} else {
    $ca = (Resolve-Path -LiteralPath $SslRootCert).Path
    $dockerArgs += @('-it', '-e', "PGHOST=$PoolerHost", '-e', 'PGPORT=5432', '-e', "PGUSER=postgres.$ProjectRef",
                     '-e', 'TT_PROMPT=1', '-e', 'PGSSLMODE=verify-full', '-e', 'PGSSLROOTCERT=/certs/ca.crt',
                     '-e', 'PGAPPNAME=cari1_backup', '-v', "${ca}:/certs/ca.crt:ro")
}
$dockerArgs += @('-e', 'PGDATABASE=postgres', '-e', "TT_OUT=$outName",
                 '-v', "${OutDir}:/out", '-v', "${workDir}:/work:ro",
                 '--entrypoint', 'bash', $image, '/work/backup.sh')

if (-not $SelfTestLocal) { Write-Host 'pg_dump will ask "Password:" - type the database password there (input hidden), press Enter once.' }
& docker @dockerArgs
if ($LASTEXITCODE -ne 0) {
    Remove-Item (Join-Path $OutDir "$outName.partial") -ErrorAction SilentlyContinue
    throw "pg_dump failed (exit $LASTEXITCODE). Nothing was kept."
}
$f = Get-Item (Join-Path $OutDir $outName)
Write-Host ("Backup written: {0} ({1:n0} bytes). Keep it outside the repository; never upload it to GitHub." -f $f.FullName, $f.Length)
