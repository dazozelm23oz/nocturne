Add-Type -AssemblyName System.Windows.Forms

# Define Win32 Helper for Always-On-Top and Fullscreen Window Positioning
$typeDef = @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class KioskWin32Helper {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const int SW_MAXIMIZE = 3;

    public static List<IntPtr> FindProcessWindows(uint[] pids) {
        HashSet<uint> set = new HashSet<uint>(pids);
        List<IntPtr> found = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                if (set.Contains(pid)) {
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    if (sb.Length > 0) {
                        found.Add(hWnd);
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'KioskWin32Helper').Type) {
    Add-Type -TypeDefinition $typeDef
}

# 1. Verify / ensure local server is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2
} catch {
    Write-Host "Starting local Lirics server..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d C:\Users\Ziad\.gemini\antigravity\scratch\lirics && npm run dev" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# 2. Identify Monitor 1 (DISPLAY1)
$targetScreen = [System.Windows.Forms.Screen]::AllScreens | Where-Object { $_.DeviceName -like "*DISPLAY1*" }
if (-not $targetScreen) {
    Write-Host "DISPLAY1 not found explicitly, selecting first monitor..."
    $targetScreen = [System.Windows.Forms.Screen]::AllScreens[0]
}

$x = $targetScreen.Bounds.X
$y = $targetScreen.Bounds.Y
$width = $targetScreen.Bounds.Width
$height = $targetScreen.Bounds.Height

Write-Host "Target Screen ($($targetScreen.DeviceName)): Bounds=[X=$x, Y=$y, Width=$width, Height=$height]"

# 3. Dedicated User Data Directory to isolate this Chrome instance
$dataDir = "C:\Users\Ziad\.gemini\antigravity\scratch\lirics\.chrome-kiosk"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 4. Chrome Arguments
$chromeArgs = @(
    "--app=http://127.0.0.1:3000",
    "--user-data-dir=`"$dataDir`"",
    "--window-position=$x,$y",
    "--window-size=$width,$height",
    "--kiosk",
    "--start-fullscreen",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-pinch",
    "--disable-features=Translate"
)

Write-Host "Launching isolated Chrome kiosk..."
$proc = Start-Process -FilePath $chromePath -ArgumentList $chromeArgs -PassThru

# 5. Wait for window creation and enforce Always-On-Top on Monitor 1
Start-Sleep -Seconds 2

$pidList = [System.Collections.Generic.List[uint32]]::new()
$allChrome = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$dataDir*" }
foreach ($p in $allChrome) {
    $pidList.Add([uint32]$p.ProcessId)
}
if ($proc.Id) {
    $pidList.Add([uint32]$proc.Id)
}

$windows = [KioskWin32Helper]::FindProcessWindows($pidList.ToArray())
Write-Host "Found $($windows.Count) window(s) for Chrome kiosk."

foreach ($hWnd in $windows) {
    [KioskWin32Helper]::SetWindowPos($hWnd, [KioskWin32Helper]::HWND_TOPMOST, $x, $y, $width, $height, [KioskWin32Helper]::SWP_SHOWWINDOW)
    [KioskWin32Helper]::SetForegroundWindow($hWnd)
}

Write-Host "Lirics is now active in fullscreen kiosk mode on Monitor 1 (Always On Top)!"
