Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtAsync, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtAsync))
    $netTask.Wait(2000) | Out-Null
    $netTask.Result
}

try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType=WindowsRuntime] | Out-Null
    $managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $sessions = $manager.GetSessions()
    $session = $null
    foreach ($s in $sessions) {
        $appId = ("" + $s.SourceAppUserModelId + " " + $s.SourceAppId).ToLower()
        if ($appId -like "*spotify*") {
            $session = $s
            break
        }
    }

    if ($session) {
        Write-Host "Calling TrySkipPreviousAsync..."
        $op = $session.TrySkipPreviousAsync()
        $res = Await $op ([bool])
        Write-Host "TrySkipPreviousAsync result: $res"
    }
} catch {
    Write-Host "Error: $_"
}
