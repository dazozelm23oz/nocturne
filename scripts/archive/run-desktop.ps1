# Nocturne Native Desktop Launcher (PowerShell) - Single Instance & Auto-Server Enforced
$ErrorActionPreference = "SilentlyContinue"
Set-Location $PSScriptRoot

# Ensure Rust/Cargo is in PATH
if (Test-Path "$env:USERPROFILE\.cargo\bin") {
    $env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH
}

# 1. Single Instance Check: If Nocturne is already running, focus existing window
$runningApp = Get-Process -Name "nocturne", "app" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($runningApp) {
    Write-Host "[Nocturne] An instance of Nocturne Desktop is already running (PID: $($runningApp.Id))." -ForegroundColor Yellow
    Write-Host "[Nocturne] Focusing existing window..." -ForegroundColor Cyan

    $wshell = New-Object -ComObject Wscript.Shell
    $wshell.AppActivate($runningApp.Id)
    Exit 0
}

# 2. Check if local background server is already up
$serverUp = $false
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -eq 200) { $serverUp = $true }
} catch {
    $serverUp = $false
}

# 3. If server is not running, launch it silently in the background and wait until it's ready
if (-not $serverUp) {
    Write-Host "[Nocturne] Starting local background server..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -Command `"cd $PSScriptRoot; npx next dev -H 127.0.0.1 -p 3000`"" -WindowStyle Hidden

    # Poll until server is fully responsive (up to 15 seconds)
    $retries = 0
    while (-not $serverUp -and $retries -lt 30) {
        Start-Sleep -Milliseconds 500
        $retries++
        try {
            $check = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 1
            if ($check.StatusCode -eq 200) {
                $serverUp = $true
            }
        } catch {}
    }
}

# 4. Launch Native Desktop Application
Write-Host "[Nocturne] Launching Native Desktop Application..." -ForegroundColor Green
$nocturneDebugExe = Join-Path $PSScriptRoot "src-tauri\target\debug\nocturne.exe"
$nocturneReleaseExe = Join-Path $PSScriptRoot "src-tauri\target\release\nocturne.exe"
$appDebugExe = Join-Path $PSScriptRoot "src-tauri\target\debug\app.exe"

if (Test-Path $nocturneDebugExe) {
    Start-Process -FilePath $nocturneDebugExe
} elseif (Test-Path $nocturneReleaseExe) {
    Start-Process -FilePath $nocturneReleaseExe
} elseif (Test-Path $appDebugExe) {
    Start-Process -FilePath $appDebugExe
} else {
    npm run desktop
}
