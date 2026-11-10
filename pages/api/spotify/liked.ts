import { NextApiRequest, NextApiResponse } from "next";
import { getToken, JWT } from "next-auth/jwt";
import {
  isSpotifyRateLimited,
  triggerSpotifyRateLimit,
} from "@/lib/rateLimitCoordinator";
import { getPersistentCache, setPersistentCache } from "@/lib/persistentCache";

// In-memory cache to prevent redundant Spotify library lookups
const likedCache = new Map<string, { liked: boolean; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const rawId = (
      (req.query.id as string) ||
      (req.body && req.body.id) ||
      ""
    ).trim();

    const cleanId = rawId.replace("spotify:track:", "").trim();
    if (!cleanId) {
      return res.status(400).json({ error: "Track ID is required" });
    }

    const trackUri = `spotify:track:${cleanId}`;

    // 1. Check in-memory fast cache
    const cached = likedCache.get(cleanId);
    if (req.method === "GET" && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json({ liked: cached.liked, fromCache: true });
    }

    // 2. Check local persistent disk/memory favorites store (100% resilient when offline/rate-limited)
    const localFav = await getPersistentCache<boolean>("local_favorites", cleanId);

    // 3. Handle local persistent actions when unauthenticated or offline
    const tk = await getToken({ req }).catch(() => null);

    // If Spotify is rate-limited or no user token is present, rely on persistent local favorites!
    if (!tk || isSpotifyRateLimited()) {
      if (req.method === "GET") {
        return res.status(200).json({ liked: Boolean(localFav), fromCache: true, rateLimited: isSpotifyRateLimited() });
      }
      if (req.method === "PUT" || req.method === "POST") {
        await setPersistentCache("local_favorites", cleanId, true);
        likedCache.set(cleanId, { liked: true, timestamp: Date.now() });
        return res.status(200).json({ status: true, liked: true, fromLocal: true });
      }
      if (req.method === "DELETE") {
        await setPersistentCache("local_favorites", cleanId, false);
        likedCache.set(cleanId, { liked: false, timestamp: Date.now() });
        return res.status(200).json({ status: true, liked: false, fromLocal: true });
      }
    }

    const token: JWT = JSON.parse(JSON.stringify(tk, null, 2));
    const accessToken = token.access_token;

    // 1. GET: Check if track is saved in library
    if (req.method === "GET") {
      // If locally favorited, return immediately
      if (localFav === true) {
        return res.status(200).json({ liked: true, fromCache: true });
      }

      // If cleanId is an SMTC title string (not 22-char Spotify ID), use local favorite state
      if (cleanId.includes("_") && cleanId.length > 22) {
        return res.status(200).json({ liked: Boolean(localFav), fromCache: true });
      }

      const newUrl = `https://api.spotify.com/v1/me/library/contains?uris=${encodeURIComponent(
        trackUri
      )}`;

      let spotifyRes = await fetch(newUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (spotifyRes.status === 429) {
        const retryHeader = parseInt(spotifyRes.headers.get("retry-after") || "120", 10);
        triggerSpotifyRateLimit(retryHeader);
        return res.status(200).json({ liked: Boolean(localFav), rateLimited: true });
      }

      if (spotifyRes.ok) {
        const data = await spotifyRes.json();
        const isLiked = Array.isArray(data) ? Boolean(data[0]) : false;
        likedCache.set(cleanId, { liked: isLiked, timestamp: Date.now() });
        await setPersistentCache("local_favorites", cleanId, isLiked);
        return res.status(200).json({ liked: isLiked });
      }

      // If unified endpoint returns 404, fallback to legacy /v1/me/tracks/contains
      if (spotifyRes.status === 404) {
        const legacyUrl = `https://api.spotify.com/v1/me/tracks/contains?ids=${encodeURIComponent(
          cleanId
        )}`;
        spotifyRes = await fetch(legacyUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (spotifyRes.status === 429) {
          const retryHeader = parseInt(spotifyRes.headers.get("retry-after") || "120", 10);
          triggerSpotifyRateLimit(retryHeader);
          return res.status(200).json({ liked: Boolean(localFav), rateLimited: true });
        }

        if (spotifyRes.ok) {
          const data = await spotifyRes.json();
          const isLiked = Array.isArray(data) ? Boolean(data[0]) : false;
          likedCache.set(cleanId, { liked: isLiked, timestamp: Date.now() });
          await setPersistentCache("local_favorites", cleanId, isLiked);
          return res.status(200).json({ liked: isLiked });
        }
      }

      // Fallback to local favorite
      return res.status(200).json({ liked: Boolean(localFav), fromCache: true });
    }

    // 2. PUT / POST: Save track to library
    if (req.method === "PUT" || req.method === "POST") {
      await setPersistentCache("local_favorites", cleanId, true);
      likedCache.set(cleanId, { liked: true, timestamp: Date.now() });

      // If cleanId is an SMTC string, persistent local cache is sufficient
      if (cleanId.includes("_") && cleanId.length > 22) {
        return res.status(200).json({ status: true, liked: true, fromLocal: true });
      }

      const newUrl = `https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(
        trackUri
      )}`;

      let spotifyRes = await fetch(newUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (spotifyRes.status === 429) {
        const retryHeader = parseInt(spotifyRes.headers.get("retry-after") || "120", 10);
        triggerSpotifyRateLimit(retryHeader);
        return res.status(200).json({ status: true, liked: true, fromLocal: true });
      }

      if (spotifyRes.ok) {
        return res.status(200).json({ status: true, liked: true });
      }

      if (spotifyRes.status === 404) {
        const legacyUrl = `https://api.spotify.com/v1/me/tracks?ids=${encodeURIComponent(
          cleanId
        )}`;
        spotifyRes = await fetch(legacyUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (spotifyRes.ok) {
          return res.status(200).json({ status: true, liked: true });
        }
      }

      return res.status(200).json({ status: true, liked: true, fromLocal: true });
    }

    // 3. DELETE: Remove track from library
    if (req.method === "DELETE") {
      await setPersistentCache("local_favorites", cleanId, false);
      likedCache.set(cleanId, { liked: false, timestamp: Date.now() });

      if (cleanId.includes("_") && cleanId.length > 22) {
        return res.status(200).json({ status: true, liked: false, fromLocal: true });
      }

      const newUrl = `https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(
        trackUri
      )}`;

      let spotifyRes = await fetch(newUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (spotifyRes.status === 429) {
        const retryHeader = parseInt(spotifyRes.headers.get("retry-after") || "120", 10);
        triggerSpotifyRateLimit(retryHeader);
        return res.status(200).json({ status: true, liked: false, fromLocal: true });
      }

      if (spotifyRes.ok) {
        return res.status(200).json({ status: true, liked: false });
      }

      if (spotifyRes.status === 404) {
        const legacyUrl = `https://api.spotify.com/v1/me/tracks?ids=${encodeURIComponent(
          cleanId
        )}`;
        spotifyRes = await fetch(legacyUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (spotifyRes.ok) {
          return res.status(200).json({ status: true, liked: false });
        }
      }

      return res.status(200).json({ status: true, liked: false, fromLocal: true });
    }

    return res.status(405).json({
      message: "Invalid Method! EXPECTED: GET, PUT, POST, or DELETE.",
      status: 405,
    });
  } catch (err: any) {
    console.error("Error in liked API:", err);
    return res.status(500).json({ error: err?.message || err });
  }
}
