const fs = require('fs');
let c = fs.readFileSync('launch-kiosk.ps1', 'utf8').replace(/\r\n/g, '\n');

const search = `# 3. Dedicated User Data Directory to isolate this Chrome instance
$dataDir = "C:\\Users\\Ziad\\.gemini\\antigravity\\scratch\\lirics\\.chrome-kiosk"
$chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`;

const replace = `# 3. Dedicated User Data Directory to isolate this Chrome instance
$dataDir = "C:\\Users\\Ziad\\.gemini\\antigravity\\scratch\\lirics\\.chrome-kiosk"
$chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

# Single Instance Check: Prevent duplicate kiosk windows
$existingKiosk = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$dataDir*" } | Select-Object -First 1
if ($existingKiosk) {
    Write-Host "[Lirics] An instance of Lirics Kiosk is already running (PID: $($existingKiosk.ProcessId)). Focusing existing window..." -ForegroundColor Yellow
    $allExisting = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$dataDir*" }
    $pids = @($allExisting | ForEach-Object { [uint32]$_.ProcessId })
    $existingWindows = [KioskWin32Helper]::FindProcessWindows($pids)
    foreach ($hWnd in $existingWindows) {
        [KioskWin32Helper]::SetForegroundWindow($hWnd)
    }
    Exit 0
}`;

c = c.replace(search, replace);
fs.writeFileSync('launch-kiosk.ps1', c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated launch-kiosk.ps1!');
