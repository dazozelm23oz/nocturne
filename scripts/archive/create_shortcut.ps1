$desktopPath = [Environment]::GetFolderPath('Desktop')
$oldShortcut = Join-Path $desktopPath 'Lirics.lnk'
$newShortcut = Join-Path $desktopPath 'Nocturne.lnk'
$vbsPath = 'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\launch-desktop.vbs'
$iconPath = 'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\src-tauri\icons\icon.ico'
$workDir = 'C:\Users\Ziad\.gemini\antigravity\scratch\lirics'

if (Test-Path $oldShortcut) {
    Remove-Item $oldShortcut -Force
}

$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($newShortcut)
$sc.TargetPath = 'wscript.exe'
$sc.Arguments = '"' + $vbsPath + '"'
$sc.WorkingDirectory = $workDir
$sc.IconLocation = $iconPath + ',0'
$sc.Description = 'Nocturne — Synced Music & Lyrics'
$sc.Save()

Write-Output "Successfully created Nocturne desktop shortcut: $newShortcut"
