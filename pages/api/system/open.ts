import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // Security check: only allow safe web URLs and spotify URI protocols
  const isSafe =
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("spotify:");

  if (!isSafe) {
    return res.status(400).json({ error: "Invalid protocol" });
  }

  // Escape double quotes for shell execution
  const sanitizedUrl = url.replace(/"/g, '\\"');

  const platform = process.platform;
  let command = "";

  if (platform === "win32") {
    command = `start "" "${sanitizedUrl}"`;
  } else if (platform === "darwin") {
    command = `open "${sanitizedUrl}"`;
  } else {
    command = `xdg-open "${sanitizedUrl}"`;
  }

  exec(command, (err) => {
    if (err) {
      console.warn("Failed to launch system URL:", err);
      return res.status(500).json({ error: "Failed to open URL", details: err.message });
    }
    return res.status(200).json({ success: true, opened: url });
  });
}
