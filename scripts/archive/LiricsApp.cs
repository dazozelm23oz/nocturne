using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class Program {
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

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public const uint SWP_SHOWWINDOW = 0x0040;

    static void Main(string[] args) {
        EnsureServerRunning();

        // 1. Target Screen (DISPLAY1 or first screen)
        Screen targetScreen = null;
        foreach (Screen s in Screen.AllScreens) {
            if (s.DeviceName.Contains("DISPLAY1")) {
                targetScreen = s;
                break;
            }
        }
        if (targetScreen == null && Screen.AllScreens.Length > 0) {
            targetScreen = Screen.AllScreens[0];
        }

        int x = targetScreen.Bounds.X;
        int y = targetScreen.Bounds.Y;
        int width = targetScreen.Bounds.Width;
        int height = targetScreen.Bounds.Height;

        string dataDir = @"C:\Users\Ziad\.gemini\antigravity\scratch\lirics\.chrome-kiosk";
        string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";

        if (!File.Exists(chromePath)) {
            return;
        }

        string chromeArgs = string.Format(
            "--app=http://127.0.0.1:3000 --user-data-dir=\"{0}\" --window-position={1},{2} --window-size={3},{4} --kiosk --start-fullscreen --no-first-run --no-default-browser-check --disable-pinch",
            dataDir, x, y, width, height
        );

        ProcessStartInfo psi = new ProcessStartInfo(chromePath, chromeArgs);
        psi.UseShellExecute = false;
        Process.Start(psi);

        // 2. Wait for window creation and enforce HWND_TOPMOST
        Thread.Sleep(2500);

        List<IntPtr> windows = FindKioskWindows();
        foreach (IntPtr hWnd in windows) {
            SetWindowPos(hWnd, HWND_TOPMOST, x, y, width, height, SWP_SHOWWINDOW);
            SetForegroundWindow(hWnd);
        }

        // 3. Keep Lirics.exe running as host & supervisor while kiosk window is open
        while (HasKioskWindow()) {
            Thread.Sleep(1500);
        }
    }

    static void EnsureServerRunning() {
        try {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:3000");
            req.Timeout = 1500;
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) {
                if (resp.StatusCode == HttpStatusCode.OK) {
                    return;
                }
            }
        } catch {
            ProcessStartInfo srvInfo = new ProcessStartInfo("cmd.exe", "/c cd /d C:\\Users\\Ziad\\.gemini\antigravity\\scratch\\lirics && npm run dev");
            srvInfo.WindowStyle = ProcessWindowStyle.Hidden;
            srvInfo.CreateNoWindow = true;
            Process.Start(srvInfo);
            Thread.Sleep(3000);
        }
    }

    static bool HasKioskWindow() {
        return FindKioskWindows().Count > 0;
    }

    static List<IntPtr> FindKioskWindows() {
        List<IntPtr> found = new List<IntPtr>();
        HashSet<uint> pids = new HashSet<uint>();

        Process[] allChrome = Process.GetProcessesByName("chrome");
        foreach (Process p in allChrome) {
            pids.Add((uint)p.Id);
        }

        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                if (pids.Contains(pid)) {
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    string title = sb.ToString();
                    if (title.Contains("Lirics") || title.Contains("lirics") || title.Contains("127.0.0.1:3000")) {
                        found.Add(hWnd);
                    }
                }
            }
            return true;
        }, IntPtr.Zero);

        return found;
    }
}
