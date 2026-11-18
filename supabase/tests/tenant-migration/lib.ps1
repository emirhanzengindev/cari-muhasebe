# Shared helpers for the tenant migration tests. LOCAL TEST DATABASE ONLY.
#
# Every SQL file runs through `docker exec <local db container> psql`, so these
# helpers cannot reach the live project: there is no connection string here.
# Each SQL test file also refuses to run unless tenant_test.local_marker exists.

$ErrorActionPreference = 'Stop'

$script:Container    = 'supabase_db_cari1-tenant-test'
$script:TestDir      = $PSScriptRoot
$script:RepoRoot     = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$script:LocalProject = Join-Path (Split-Path $script:RepoRoot -Parent) 'cari1-tenant-test'
$script:ForwardSql   = Join-Path $script:RepoRoot 'supabase\migrations\20261118130000_tenant_model_app_metadata.sql'
$script:RollbackSql  = Join-Path $script:RepoRoot 'supabase\rollbacks\20261118130000_tenant_model_app_metadata.down.sql'
$script:LogDir       = Join-Path $script:LocalProject 'logs'

function Get-SupabaseCli {
    # Always returns an array: exe first, then fixed leading arguments. The
    # leading comma stops PowerShell from unrolling a one-element array into a
    # plain string (which made $cli[0] the first character of the path).
    if ($env:SUPABASE_CLI -and (Test-Path $env:SUPABASE_CLI)) { return , @($env:SUPABASE_CLI) }
    $cmd = Get-Command supabase -ErrorAction SilentlyContinue
    if ($cmd) { return , @($cmd.Source) }
    # pinned version, released 2026-11-02
    return , @('npx', '--yes', 'supabase@2.122.1')
}

function Invoke-Native {
    param([string]$Exe, [string]$Arguments)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    $psi.Arguments = $Arguments
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEndAsync()
    $err = $p.StandardError.ReadToEndAsync()
    $p.WaitForExit()
    [pscustomobject]@{ ExitCode = $p.ExitCode; StdOut = $out.Result; StdErr = $err.Result }
}

function Start-Native {
    # Background process with captured output (for the lock tests)
    param([string]$Exe, [string]$Arguments)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    $psi.Arguments = $Arguments
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    [pscustomobject]@{
        Process = $p
        Out     = $p.StandardOutput.ReadToEndAsync()
        Err     = $p.StandardError.ReadToEndAsync()
        Watch   = [System.Diagnostics.Stopwatch]::StartNew()
    }
}

function Assert-LocalContainer {
    $r = Invoke-Native 'docker' "inspect --format {{.State.Running}} $script:Container"
    if ($r.ExitCode -ne 0 -or $r.StdOut.Trim() -ne 'true') {
        throw "Local test database container '$script:Container' is not running. Start it: cd $script:LocalProject; supabase start"
    }
}

function Copy-ToContainer {
    param([string]$Path, [string]$Name)
    Invoke-Native 'docker' "exec $script:Container mkdir -p /tmp/tt" | Out-Null
    $r = Invoke-Native 'docker' "cp `"$Path`" ${script:Container}:/tmp/tt/$Name"
    if ($r.ExitCode -ne 0) { throw "docker cp failed: $($r.StdErr)" }
    "/tmp/tt/$Name"
}

function Get-PsqlArgs {
    param([string]$ContainerPath, [string]$User = 'postgres')
    if ($User -notin @('postgres', 'supabase_admin')) { throw "Unsupported user $User" }
    "exec $script:Container psql -U $User -d postgres -X -v ON_ERROR_STOP=1 -f $ContainerPath"
}

function Invoke-LocalSqlFile {
    param([string]$Path, [string]$User = 'postgres', [switch]$ExpectFailure, [string]$Label)
    Assert-LocalContainer
    if (-not (Test-Path $Path)) { throw "File not found: $Path" }
    $name = [IO.Path]::GetFileName($Path)
    $cp = Copy-ToContainer $Path $name
    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    $r = Invoke-Native 'docker' (Get-PsqlArgs $cp $User)
    $watch.Stop()
    $title = if ($Label) { $Label } else { $name }
    Write-Log ("==== {0} ({1}, as {2}) exit={3} {4:n1}s" -f $title, $name, $User, $r.ExitCode, $watch.Elapsed.TotalSeconds) $r
    if ($ExpectFailure) {
        if ($r.ExitCode -eq 0) { throw "Expected $name to FAIL, but it succeeded" }
    } elseif ($r.ExitCode -ne 0) {
        throw "$name failed (exit $($r.ExitCode)). See log $script:CurrentLog"
    }
    $r
}

function Assert-LocalMarker {
    $q = Join-Path $env:TEMP 'tt_marker_check.sql'
    Set-Content -Path $q -Encoding ascii -Value "SELECT 'MARKER_OK' FROM tenant_test.local_marker LIMIT 1;"
    $cp = Copy-ToContainer $q 'marker_check.sql'
    $r = Invoke-Native 'docker' (Get-PsqlArgs $cp 'postgres')
    if ($r.ExitCode -ne 0 -or $r.StdOut -notmatch 'MARKER_OK') {
        throw 'tenant_test.local_marker not found: run prepare_local.ps1 first'
    }
}

function Write-Log {
    param([string]$Header, $Result)
    if (-not (Test-Path $script:LogDir)) { New-Item -ItemType Directory -Force $script:LogDir | Out-Null }
    if (-not $script:CurrentLog) {
        $script:CurrentLog = Join-Path $script:LogDir ("{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))
    }
    $text = $Header + "`r`n"
    if ($Result) { $text += $Result.StdOut + "`r`n" + $Result.StdErr + "`r`n" }
    Add-Content -Path $script:CurrentLog -Value $text -Encoding utf8
    Write-Host $Header
    if ($Result) {
        # show failures, notices of stage results and the rollback/migration summary lines
        ($Result.StdOut + "`n" + $Result.StdErr) -split "`r?`n" |
            Where-Object { $_ -match 'STAGE|ERROR|FAILED|Migration OK|R2:|NOTICE:  .* / |Abort|Check failed|lock timeout|deadlock' } |
            ForEach-Object { Write-Host "    $_" }
    }
}
