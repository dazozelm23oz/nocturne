Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '       LIRICS SYSTEM USAGE (TASK MONITOR)        ' -ForegroundColor Cyan
Write-Host '==================================================' -ForegroundColor Cyan

$procs = Get-CimInstance Win32_Process | Where-Object { 
    $_.Name -eq 'Lirics.exe' -or 
    ($_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*chrome-kiosk*') 
}

if (-not $procs) {
    Write-Host 'Lirics is not currently running.' -ForegroundColor Yellow
    exit
}

$totalMem = 0
foreach ($p in $procs) {
    $procObj = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
    if ($procObj) {
        $memMb = [math]::Round($procObj.WorkingSet64 / 1MB, 2)
        $totalMem += $memMb
        $role = if ($p.Name -eq 'Lirics.exe') { 'Host Application' } else { 
            if ($p.CommandLine -like '*--type=gpu-process*') { 'GPU Engine' }
            elseif ($p.CommandLine -like '*--type=renderer*') { 'UI Renderer' }
            elseif ($p.CommandLine -like '*--type=utility*') { 'Audio/Network Utility' }
            else { 'Browser Core' }
        }
        Write-Host ('[{0,5}] {1,-22} : {2,7} MB' -f $p.ProcessId, $role, $memMb)
    }
}
Write-Host '--------------------------------------------------' -ForegroundColor DarkGray
Write-Host ('TOTAL MEMORY CONSUMPTION   : {0,7} MB' -f [math]::Round($totalMem, 2)) -ForegroundColor Green
Write-Host '==================================================' -ForegroundColor Cyan
