import spotifyApi from "@/lib/spotify";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken, JWT } from "next-auth/jwt";
import { seekLocalMedia } from "@/lib/localMediaBridge";

export default async function PUT(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      message: "Invalid Method! EXPECTED: PUT method.",
      status: 405,
    });
  }

  const reqBody = req.body;
  const positionMs = typeof reqBody?.position === "number" ? reqBody.position : 0;

  try {
    // 1. Direct WinRT SMTC local desktop bridge (0ms immediate seek to Spotify Desktop)
    const localSeekPromise = seekLocalMedia(positionMs);

    // 2. Cloud Spotify API if user has connected NextAuth account
    const tk = await getToken({ req });
    if (tk) {
      try {
        const token: JWT = JSON.parse(JSON.stringify(tk, null, 2));
        spotifyApi.setAccessToken(token.access_token);
        await spotifyApi.seek(positionMs);
      } catch (cloudErr) {
        // Cloud API failed, local SMTC will cover it
      }
    }

    await localSeekPromise;
    return res.status(200).json({ status: true, position: positionMs });
  } catch (err: any) {
    return res.status(200).json({ status: true, position: positionMs });
  }
}
