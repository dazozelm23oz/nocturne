import { LyricProvider, LyricFetchParams, LyricProviderResult } from "./types";
import { resilientFetchJson } from "../resilientFetch";
import { parseLrcString } from "./lrcParser";

export const musixmatchProvider: LyricProvider = {
  id: "musixmatch",
  name: "Musixmatch",
  supportsKaraoke: false,

  async fetch({ track, artist = "", signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const cleanTrack = (track || "").trim();

    try {
      // Use public desktop app token & search
      const tokenUrl = "https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0";
      const tokenRes = await resilientFetchJson<any>(tokenUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        silent: true,
      });

      const userToken = tokenRes.data?.message?.body?.user_token || "240523ec3e33c7fc017bfb9d99727bf14e5b98a3b04c8f553f1911";

      const macroUrl = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&q_track=${encodeURIComponent(
        cleanTrack
      )}&q_artist=${encodeURIComponent(
        artist
      )}&user_language=en&f_subtitle_length_max_deviation=1&subtitle_format=lrc&app_id=web-desktop-app-v1.0&usertoken=${encodeURIComponent(
        userToken
      )}`;

      const macroRes = await resilientFetchJson<any>(macroUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        silent: true,
      });

      const subtitleBody =
        macroRes.data?.message?.body?.macro_calls?.["track.subtitles.get"]?.message?.body?.subtitle_list?.[0]?.subtitle
          ?.subtitle_body;

      if (subtitleBody && typeof subtitleBody === "string") {
        const lines = parseLrcString(subtitleBody);
        if (lines.length > 0) {
          return {
            lyrics: lines,
            synced: true,
            isWordSynced: false,
            source: "musixmatch",
          };
        }
      }
    } catch {}

    return null;
  },
};
