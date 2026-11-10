const { execSync } = require('child_process');
const fs = require('fs');

const testCs = `
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

class Program {
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = false)]
    static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    const uint WM_APPCOMMAND = 0x0319;

    static void Main(string[] args) {
        Process[] procs = Process.GetProcessesByName("Spotify");
        Console.WriteLine("Spotify processes: " + procs.Length);
        foreach (var p in procs) {
            if (p.MainWindowHandle != IntPtr.Zero) {
                Console.WriteLine("MainWindow: " + p.MainWindowTitle + " Handle: " + p.MainWindowHandle);
            }
        }
    }
}
`;

fs.writeFileSync('C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.cs', testCs);
execSync('C:\\\\Windows\\\\Microsoft.NET\\\\Framework64\\\\v4.0.30319\\\\csc.exe /nologo /out:C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.exe C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.cs');
const out = execSync('C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.exe').toString();
console.log(out);
fs.unlinkSync('C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.cs');
fs.unlinkSync('C:/Users/Ziad/.gemini/antigravity/scratch/lirics/test_proc.exe');
