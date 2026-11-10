import { LyricProvider, LyricFetchParams, LyricProviderResult } from "./types";
import { resilientFetchJson } from "../resilientFetch";
import { parseLrcString } from "./lrcParser";

export const kugouProvider: LyricProvider = {
  id: "kugou",
  name: "Kugou Music",
  supportsKaraoke: true,

  async fetch({ track, artist = "", duration, signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const cleanTrack = (track || "").trim();
    const keyword = `${cleanTrack} ${artist}`.trim();

    try {
      // 1. Search song hash on Kugou
      const searchUrl = `http://mobilecdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(
        keyword
      )}&page=1&pagesize=5`;

      const searchRes = await resilientFetchJson<any>(searchUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Nocturne/2.0.0" },
        silent: true,
      });

      if (!searchRes.ok || !searchRes.data?.data?.info?.[0]) return null;

      const topSong = searchRes.data.data.info[0];
      const hash = topSong.hash;
      if (!hash) return null;

      // 2. Search lyric candidate
      const durParam = duration ? Math.round(duration) : (topSong.duration || "");
      const lyricSearchUrl = `http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=&duration=${durParam}&hash=${hash}`;

      const lyricSearchRes = await resilientFetchJson<any>(lyricSearchUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Nocturne/2.0.0" },
        silent: true,
      });

      if (!lyricSearchRes.ok || !lyricSearchRes.data?.candidates?.[0]) return null;

      const candidate = lyricSearchRes.data.candidates[0];
      const { id, accesskey } = candidate;
      if (!id || !accesskey) return null;

      // 3. Download LRC lyrics content (base64)
      const downloadUrl = `http://krcs.kugou.com/download?ver=1&client=mobi&id=${id}&accesskey=${accesskey}&fmt=lrc`;
      const downloadRes = await resilientFetchJson<any>(downloadUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Nocturne/2.0.0" },
        silent: true,
      });

      if (!downloadRes.ok || !downloadRes.data?.content) return null;

      const decodedLrc = Buffer.from(downloadRes.data.content, "base64").toString("utf-8");
      const lines = parseLrcString(decodedLrc);

      if (lines.length > 0) {
        return {
          lyrics: lines,
          synced: true,
          isWordSynced: false,
          source: "kugou",
        };
      }
    } catch {}

    return null;
  },
};
