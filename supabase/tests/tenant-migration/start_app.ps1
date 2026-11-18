# Starts the old build (main worktree) or the new build (this repo) against the
# LOCAL test stack, in a separate PowerShell process.
#   .\start_app.ps1 -Code old   # C:\...\Desktop\cari1-main-old  on port 3002
#   .\start_app.ps1 -Code new   # this repo                       on port 3001
#
# .env.local is not read or changed. Next.js does not override variables that
# are already set in the process environment, so the values set here win over
# anything in .env.local. Only the child process gets them; your shell keeps
# its own environment. The keys are the local stack's own keys.
param([Parameter(Mandatory)][ValidateSet('old', 'new')][string]$Code)

. (Join-Path $PSScriptRoot 'lib.ps1')
Assert-LocalContainer

$dir = if ($Code -eq 'old') { Join-Path (Split-Path $script:RepoRoot -Parent) 'cari1-main-old' } else { $script:RepoRoot }
$port = if ($Code -eq 'old') { 3002 } else { 3001 }
if (-not (Test-Path (Join-Path $dir 'node_modules\next'))) {
    throw "node_modules missing in $dir. Run 'npm ci' there first (needs ~1 GB free disk)."
}
$freeGb = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
if ($freeGb -lt 2) { throw "Only $freeGb GB free on C:. next dev writes .next (hundreds of MB). Free space first." }

$cli = Get-SupabaseCli
$exe = $cli[0]; $pre = @($cli | Select-Object -Skip 1)
Push-Location $script:LocalProject
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'   # PS 5.1: native stderr must not become a terminating error
try { $status = & $exe @pre status -o env 2>$null } finally { $ErrorActionPreference = $prevEap; Pop-Location }
$kv = @{}
# -cmatch: case-insensitive -match uses the current culture, and under tr-TR
# [A-Z] does not match 'I' (API_URL, SERVICE_ROLE_KEY would not be parsed).
foreach ($line in $status) { if ($line -cmatch '^([A-Z_]+)="?([^"]*)"?$') { $kv[$Matches[1]] = $Matches[2] } }
if ($kv['API_URL'] -ne 'http://127.0.0.1:54321') { throw "Unexpected local API_URL '$($kv['API_URL'])'" }
if (-not $kv['ANON_KEY'] -or -not $kv['SERVICE_ROLE_KEY']) { throw 'Local keys not found in supabase status output' }

$child = @"
`$env:NEXT_PUBLIC_SUPABASE_URL = '$($kv['API_URL'])'
`$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = '$($kv['ANON_KEY'])'
`$env:SUPABASE_SERVICE_ROLE_KEY = '$($kv['SERVICE_ROLE_KEY'])'
`$env:NEXT_PUBLIC_SITE_URL = 'http://localhost:$port'
Remove-Item Env:VERCEL_URL, Env:VERCEL_PROJECT_PRODUCTION_URL -ErrorAction SilentlyContinue
Set-Location '$dir'
Write-Host 'cari1 $Code build -> local Supabase $($kv['API_URL']) on http://localhost:$port'
npx --no-install next dev -p $port
"@
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($child))
Start-Process powershell -ArgumentList '-NoProfile', '-NoExit', '-EncodedCommand', $encoded
Write-Host "Started $Code build on http://localhost:$port (separate window)."
Write-Host "Smoke test:  `$env:TT_ANON_KEY = (local ANON_KEY from 'supabase status -o env');  node 40_api_smoke.mjs --app http://localhost:$port --label $Code-<stage>"
