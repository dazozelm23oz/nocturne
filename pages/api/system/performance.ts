import type { NextApiRequest, NextApiResponse } from "next";
import os from "os";
import { getPersistentCacheStats } from "@/lib/persistentCache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Expected GET." });
  }

  const mem = process.memoryUsage();
  const cacheStats = getPersistentCacheStats();

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      rssMb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
      heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 10) / 10,
    },
    cache: {
      entries: cacheStats.memoryEntries,
      diskSizeBytes: cacheStats.diskSizeBytes,
      redisConnected: cacheStats.redisConnected,
    },
    os: {
      platform: os.platform(),
      arch: os.arch(),
      uptimeSec: Math.round(os.uptime()),
      totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
    },
  });
}
