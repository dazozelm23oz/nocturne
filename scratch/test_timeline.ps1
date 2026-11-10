Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtAsync, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtAsync))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType=WindowsRuntime] | Out-Null
    $managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $session = $manager.GetCurrentSession()
    if ($session) {
        for ($i = 0; $i -lt 5; $i++) {
            $timeline = $session.GetTimelineProperties()
            $playback = $session.GetPlaybackInfo()
            $status = $playback.PlaybackStatus.ToString()
            $basePos = $timeline.Position.TotalMilliseconds
            $lastUpdated = $timeline.LastUpdatedTime
            $now = [DateTimeOffset]::UtcNow

            $elapsedSinceUpdate = 0
            if ($status -eq "Playing" -and $lastUpdated) {
                $elapsedSinceUpdate = [Math]::Max(0, ($now - $lastUpdated).TotalMilliseconds)
            }
            $calculatedPos = [Math]::Min($timeline.EndTime.TotalMilliseconds, $basePos + $elapsedSinceUpdate)

            Write-Output ("RawPos: " + [Math]::Round($basePos) + "ms | Elapsed: " + [Math]::Round($elapsedSinceUpdate) + "ms | RealPos: " + [Math]::Round($calculatedPos) + "ms (" + ([Math]::Round($calculatedPos / 1000, 2)) + "s)")
            Start-Sleep -Milliseconds 600
        }
    }
} catch {
    Write-Output $_
}
