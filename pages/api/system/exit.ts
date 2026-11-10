import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const platform = process.platform;
  let command = "";

  if (platform === "win32") {
    // Terminate native desktop window (nocturne.exe or Lirics.exe)
    command = `powershell -Command "Stop-Process -Name nocturne, Lirics -Force -ErrorAction SilentlyContinue"`;
  } else if (platform === "darwin") {
    command = `killall nocturne 2>/dev/null || true`;
  } else {
    command = `pkill -f nocturne 2>/dev/null || true`;
  }

  exec(command, (err) => {
    if (err) {
      console.warn("Notice: Process termination completed with code:", err);
    }
    return res.status(200).json({ success: true, message: "Application exit command dispatched" });
  });
}
