# Compares the live and local outputs of 05_roles_and_privileges.sql.
#   readonly\roles_live.txt   live output (read-only query, same text)
#   readonly\roles_local.txt  written by prepare_local.ps1
# Prints every line that differs. Known, accepted differences are labelled.

. (Join-Path $PSScriptRoot 'lib.ps1')

$dir = Join-Path $script:LocalProject 'readonly'
$live = Get-Content (Join-Path $dir 'roles_live.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$local = Get-Content (Join-Path $dir 'roles_local.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$known = @{
    '3 member_of | postgres' = 'membership list differs: live has app_backend_role(admin), local has supabase_functions_admin (CLI image); neither is used by the migration'
}

$diff = Compare-Object $live $local
if (-not $diff) { Write-Host 'Roles and privileges: IDENTICAL'; return }
$unexpected = 0
foreach ($d in $diff) {
    $key = ($d.InputObject -split ' \| ')[0..1] -join ' | '
    $side = if ($d.SideIndicator -eq '<=') { 'live ' } else { 'local' }
    $note = $known[$key]
    if (-not $note) { $unexpected++ }
    Write-Host ("[{0}] {1}{2}" -f $side, $d.InputObject, $(if ($note) { "    (known: $note)" } else { '' }))
}
if ($unexpected) { throw "$unexpected unexpected differences between live and local" }
Write-Host 'Only known differences.'
