import { LyricProvider, LyricFetchParams, LyricProviderResult } from "./types";
import { resilientFetchJson } from "../resilientFetch";
import { parseLrcString } from "./lrcParser";

export const lrclibProvider: LyricProvider = {
  id: "lrclib",
  name: "LRCLIB",
  supportsKaraoke: true,

  async fetch({ track, artist = "", album = "", signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const cleanTrack = (track || "").trim();

    try {
      // 1. Exact query
      const exactUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
        cleanTrack
      )}&album_name=${encodeURIComponent(album)}&artist_name=${encodeURIComponent(artist)}`;

      const exactRes = await resilientFetchJson<any[]>(exactUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Nocturne/2.0.0" },
        silent: true,
      });

      if (exactRes.ok && Array.isArray(exactRes.data) && exactRes.data.length > 0) {
        const item = exactRes.data.find((a: any) => a.syncedLyrics) || exactRes.data[0];
        if (item.syncedLyrics) {
          const lines = parseLrcString(item.syncedLyrics);
          if (lines.length > 0) {
            return {
              lyrics: lines,
              synced: true,
              isWordSynced: false,
              source: "lrclib",
            };
          }
        }
        if (item.plainLyrics) {
          return {
            lyrics: item.plainLyrics,
            synced: false,
            source: "lrclib",
          };
        }
      }

      // 2. Broad search fallback
      const broadUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
        cleanTrack
      )}&artist_name=${encodeURIComponent(artist)}`;

      const broadRes = await resilientFetchJson<any[]>(broadUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: { "User-Agent": "Nocturne/2.0.0" },
        silent: true,
      });

      if (broadRes.ok && Array.isArray(broadRes.data) && broadRes.data.length > 0) {
        const item = broadRes.data.find((a: any) => a.syncedLyrics) || broadRes.data[0];
        if (item.syncedLyrics) {
          const lines = parseLrcString(item.syncedLyrics);
          if (lines.length > 0) {
            return {
              lyrics: lines,
              synced: true,
              isWordSynced: false,
              source: "lrclib",
            };
          }
        }
        if (item.plainLyrics) {
          return {
            lyrics: item.plainLyrics,
            synced: false,
            source: "lrclib",
          };
        }
      }
    } catch {}

    return null;
  },
};
