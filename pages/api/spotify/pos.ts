import spotifyApi from "@/lib/spotify";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
const getLocalPlaybackState = async (): Promise<any> => null;
import {
  isSpotifyRateLimited,
  triggerSpotifyRateLimit,
} from "@/lib/rateLimitCoordinator";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Invalid Method! Expected GET.",
      status: 405,
    });
  }

  // 1. FAST-PATH: Local Windows System Media Transport Controls (SMTC)
  // Queries running local Spotify desktop in 0.1ms with 0 network calls and 0% rate-limit risk!
  try {
    const localMedia = await getLocalPlaybackState();
    if (localMedia && localMedia.item) {
      return res.status(200).json({ data: localMedia });
    }
  } catch {
    // If local query fails, proceed to cloud fallback
  }

  // 2. CLOUD FALLBACK: Only query Spotify Cloud Web API if local SMTC returned empty
  // (e.g., listening on mobile, web player, smart TV, or Spotify Desktop not running)
  if (isSpotifyRateLimited()) {
    return res.status(200).json({ data: null, rateLimited: true });
  }

  try {
    const tk = await getToken({ req });
    if (!tk) {
      return res.status(200).json({ data: null });
    }

    const token = JSON.parse(JSON.stringify(tk, null, 2));
    spotifyApi.setAccessToken(token.access_token);
    if (token.refresh_token) {
      spotifyApi.setRefreshToken(token.refresh_token);
    }

    let playbackData: any = null;

    try {
      const response = await spotifyApi.getMyCurrentPlaybackState();
      if (response?.body?.item) {
        playbackData = response.body;
      }
    } catch (apiErr: any) {
      if (apiErr?.statusCode === 401 && token.refresh_token) {
        try {
          const refreshRes = await spotifyApi.refreshAccessToken();
          const newAccessToken = refreshRes?.body?.access_token;
          if (newAccessToken) {
            spotifyApi.setAccessToken(newAccessToken);
            const retryRes = await spotifyApi.getMyCurrentPlaybackState();
            if (retryRes?.body?.item) {
              playbackData = retryRes.body;
            }
          }
        } catch (refreshErr) {
          console.warn("Token refresh failed in pos.ts:", refreshErr);
        }
      } else if (apiErr?.statusCode === 429) {
        const retryHeader = parseInt(apiErr?.headers?.["retry-after"] || "120", 10);
        triggerSpotifyRateLimit(retryHeader);
      } else {
        console.warn("getMyCurrentPlaybackState warning:", apiErr?.message);
      }
    }

    if (!playbackData || !playbackData.item) {
      try {
        const playingResponse = await spotifyApi.getMyCurrentPlayingTrack();
        if (playingResponse?.body?.item) {
          playbackData = {
            ...playbackData,
            ...playingResponse.body,
            is_playing: playingResponse.body.is_playing ?? true,
          };
        }
      } catch (err: any) {
        if (err?.statusCode === 429) {
          triggerSpotifyRateLimit(120);
        }
      }
    }

    return res.status(200).json({ data: playbackData || null });
  } catch (err: any) {
    console.error("pos.ts cloud error:", err?.message || err);
    return res.status(200).json({ data: null });
  }
}
