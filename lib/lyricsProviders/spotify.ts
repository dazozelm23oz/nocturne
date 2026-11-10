import { LyricProvider, LyricFetchParams, LyricProviderResult, LyricLine } from "./types";
import { resilientFetchJson } from "../resilientFetch";

let cachedSpotifyToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyWebPlayerToken(spDc: string): Promise<string | null> {
  if (cachedSpotifyToken && Date.now() < cachedSpotifyToken.expiresAt - 60000) {
    return cachedSpotifyToken.token;
  }

  try {
    const res = await resilientFetchJson<any>(
      "https://open.spotify.com/get_access_token?reason=transport&productType=web-player",
      {
        timeoutMs: 2500,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: `sp_dc=${spDc.trim()}`,
        },
        silent: true,
      }
    );

    if (res.ok && res.data?.accessToken) {
      cachedSpotifyToken = {
        token: res.data.accessToken,
        expiresAt: res.data.accessTokenExpirationTimestampMs || Date.now() + 3600000,
      };
      return res.data.accessToken;
    }
  } catch {}
  return null;
}

export const spotifyProvider: LyricProvider = {
  id: "spotify",
  name: "Spotify Color Lyrics",
  supportsKaraoke: true,

  async fetch({ trackId, signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const rawTrackId = (trackId || "").replace("spotify:track:", "").trim();
    if (!rawTrackId) return null;

    const spDc = process.env.SP_DC;
    if (!spDc) return null;

    const token = await getSpotifyWebPlayerToken(spDc);
    if (!token) return null;

    try {
      const res = await resilientFetchJson<any>(
        `https://spclient.wg.spotify.com/color-lyrics/v2/track/${rawTrackId}?format=json&market=from_token&vocalRemoval=false`,
        {
          timeoutMs: 2500,
          retries: 0,
          signal,
          headers: {
            Authorization: `Bearer ${token}`,
            "App-Platform": "WebPlayer",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          silent: true,
        }
      );

      if (!res.ok || !res.data) return null;

      const data = res.data;
      if (data?.lyrics?.lines && Array.isArray(data.lyrics.lines) && data.lyrics.lines.length > 0) {
        const isSynced = data.lyrics.syncType === "LINE_SYNCED" || data.lyrics.syncType === "SYLLABLE_SYNCED";
        const hasSyllables = data.lyrics.syncType === "SYLLABLE_SYNCED";

        const lines: LyricLine[] = data.lyrics.lines.map((l: any) => {
          const ms = parseInt(l.startTimeMs || "0", 10);
          return {
            seconds: ms / 1000,
            lyrics: l.words || "",
          };
        });

        return {
          lyrics: lines,
          synced: isSynced,
          isWordSynced: hasSyllables,
          source: "spotify",
        };
      }
    } catch {}

    return null;
  },
};
