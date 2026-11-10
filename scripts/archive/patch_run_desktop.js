const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/run-desktop.ps1';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

c = c.replace(
`if (Test-Path $nocturneDebugExe) {
    Start-Process -FilePath $nocturneDebugExe
} elseif (Test-Path $nocturneReleaseExe) {
    Start-Process -FilePath $nocturneReleaseExe
} elseif (Test-Path $appDebugExe) {
    Start-Process -FilePath $appDebugExe
}`,
`if (Test-Path $nocturneDebugExe) {
    Start-Process -FilePath $nocturneDebugExe -WorkingDirectory $PSScriptRoot
} elseif (Test-Path $nocturneReleaseExe) {
    Start-Process -FilePath $nocturneReleaseExe -WorkingDirectory $PSScriptRoot
} elseif (Test-Path $appDebugExe) {
    Start-Process -FilePath $appDebugExe -WorkingDirectory $PSScriptRoot
}`
);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Updated run-desktop.ps1 with -WorkingDirectory');
