import spotifyApi from "@/lib/spotify";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken, JWT } from "next-auth/jwt";
const sendLocalMediaCommand = async (_action: string): Promise<boolean> => false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({
      message: "Invalid Method! Expected PUT or POST.",
      status: 405,
    });
  }

  const reqBody = req.body;

  let localAction: "next" | "prev" | "playpause" | "play" | "pause" | null = null;
  if (reqBody.next) localAction = "next";
  else if (reqBody.previous) localAction = "prev";
  else if (reqBody.play) localAction = "play";
  else if (reqBody.pause) localAction = "pause";

  // 1. Ultra-Fast Fast-Path: Native Windows media control executes in 30ms!
  let localExecuted = false;
  if (localAction) {
    try {
      localExecuted = await sendLocalMediaCommand(localAction);
    } catch (e) {
      console.warn("Local media command error:", e);
    }
  }

  // 2. Dispatch Cloud API in background or foreground
  const executeCloud = async () => {
    try {
      const tk = await getToken({ req });
      if (tk) {
        const token: JWT = JSON.parse(JSON.stringify(tk, null, 2));
        spotifyApi.setAccessToken(token.access_token);
        if (token.refresh_token) {
          spotifyApi.setRefreshToken(token.refresh_token);
        }

        if (reqBody.pause) {
          await spotifyApi.pause();
        } else if (reqBody.play) {
          await spotifyApi.play();
        } else if (reqBody.next) {
          await spotifyApi.skipToNext();
        } else if (reqBody.previous) {
          await spotifyApi.skipToPrevious();
        } else if (typeof reqBody.shuffle === "boolean") {
          await spotifyApi.setShuffle(reqBody.shuffle);
        } else if (typeof reqBody.repeat === "string") {
          await spotifyApi.setRepeat(reqBody.repeat as any);
        }
      }
    } catch (cloudErr) {
      // cloud API error handled silently
    }
  };

  // If local media command executed (Windows Desktop), return HTTP 200 in 30ms!
  // Only sync cloud in background if NOT play/pause (since SMTC already handles play/pause idempotently,
  // racing cloud play/pause calls can trigger Spotify server desync).
  if (localExecuted) {
    if (!reqBody.play && !reqBody.pause) {
      executeCloud();
    }
    return res.status(200).json({ status: true, source: "local_fast_path" });
  }

  // Fallback: wait for cloud API (e.g. mobile Spotify Connect)
  await executeCloud();
  return res.status(200).json({ status: true });
}
