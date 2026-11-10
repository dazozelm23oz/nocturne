import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Windows: Launch Windows Graphics Settings
  try {
    exec("start ms-settings:display-advancedgraphics", (err) => {
      if (err) {
        console.warn("Could not launch ms-settings:", err);
      }
    });
    return res.status(200).json({ status: "ok", message: "Launched Windows Graphics Settings" });
  } catch (e: any) {
    return res.status(500).json({ status: "error", error: e?.message });
  }
}
