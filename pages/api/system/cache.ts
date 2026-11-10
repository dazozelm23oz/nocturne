import type { NextApiRequest, NextApiResponse } from "next";
import { getPersistentCacheStats } from "@/lib/persistentCache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Expected GET." });
  }

  const stats = getPersistentCacheStats();
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cache: stats,
  });
}
