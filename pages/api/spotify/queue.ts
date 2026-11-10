import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import {
  isSpotifyRateLimited,
  triggerSpotifyRateLimit,
} from "@/lib/rateLimitCoordinator";
import {
  getPersistentCache,
  setPersistentCache,
} from "@/lib/persistentCache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Invalid method. Expected GET." });
  }

  if (isSpotifyRateLimited()) {
    const cachedQueue = await getPersistentCache<any[]>("queue", "latest_spotify_queue");
    return res.status(200).json({
      currently_playing: null,
      queue: cachedQueue || [],
      rateLimited: true,
    });
  }

  try {
    const tk = await getToken({ req });
    if (!tk) {
      const cachedQueue = await getPersistentCache<any[]>("queue", "latest_spotify_queue");
      return res.status(200).json({ currently_playing: null, queue: cachedQueue || [] });
    }

    const token = JSON.parse(JSON.stringify(tk, null, 2));

    const response = await fetch("https://api.spotify.com/v1/me/player/queue", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 429) {
      const retryHeader = parseInt(response.headers.get("retry-after") || "120", 10);
      triggerSpotifyRateLimit(retryHeader);
      const cachedQueue = await getPersistentCache<any[]>("queue", "latest_spotify_queue");
      return res.status(200).json({
        currently_playing: null,
        queue: cachedQueue || [],
        rateLimited: true,
      });
    }

    if (!response.ok) {
      const cachedQueue = await getPersistentCache<any[]>("queue", "latest_spotify_queue");
      return res.status(200).json({
        currently_playing: null,
        queue: cachedQueue || [],
        error: `Spotify queue error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    const slicedQueue = Array.isArray(data.queue) ? data.queue.slice(0, 10) : [];

    // Cache the queue on disk for pre-warming & resilience (TTL 24 hours)
    if (slicedQueue.length > 0) {
      await setPersistentCache("queue", "latest_spotify_queue", slicedQueue, 86400 * 1000);
    }

    return res.status(200).json({
      currently_playing: data.currently_playing,
      queue: slicedQueue,
    });
  } catch (err: any) {
    const cachedQueue = await getPersistentCache<any[]>("queue", "latest_spotify_queue");
    return res.status(200).json({ currently_playing: null, queue: cachedQueue || [] });
  }
}
