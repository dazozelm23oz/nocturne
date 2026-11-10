import { LyricProvider, LyricFetchParams, LyricProviderResult, LyricLine } from "./types";
import { resilientFetchJson } from "../resilientFetch";
import { parseLrcString } from "./lrcParser";

export const neteaseProvider: LyricProvider = {
  id: "netease",
  name: "NetEase Cloud Music",
  supportsKaraoke: true,

  async fetch({ track, artist = "", signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const cleanTrack = (track || "").trim();
    const query = `${cleanTrack} ${artist}`.trim();

    try {
      // 1. Search song ID via NetEase CloudSearch API
      const searchUrl = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(
        query
      )}&type=1&offset=0&limit=5`;

      const searchRes = await resilientFetchJson<any>(searchUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://music.163.com/",
        },
        silent: true,
      });

      if (!searchRes.ok || !searchRes.data?.result?.songs?.[0]) {
        return null;
      }

      const songId = searchRes.data.result.songs[0].id;
      if (!songId) return null;

      // 2. Fetch Lyrics (LRC and YRC / KLyric)
      const lyricUrl = `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1&rv=1&yv=1`;
      const lyricRes = await resilientFetchJson<any>(lyricUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://music.163.com/",
        },
        silent: true,
      });

      if (!lyricRes.ok || !lyricRes.data) return null;

      const data = lyricRes.data;

      // Prefer YRC if present
      if (data.yrc?.lyric && typeof data.yrc.lyric === "string") {
        const parsed = parseYrc(data.yrc.lyric);
        if (parsed.length > 0) {
          return {
            lyrics: parsed,
            synced: true,
            isWordSynced: true,
            source: "netease",
          };
        }
      }

      // Check standard LRC
      if (data.lrc?.lyric && typeof data.lrc.lyric === "string") {
        const parsed = parseLrcString(data.lrc.lyric);
        if (parsed.length > 0) {
          return {
            lyrics: parsed,
            synced: true,
            isWordSynced: false,
            source: "netease",
          };
        }
      }
    } catch {}

    return null;
  },
};

/**
 * Parses NetEase YRC format lines:
 * [time,duration](start,dur,0)word(start,dur,0)word
 */
function parseYrc(yrcContent: string): LyricLine[] {
  const result: LyricLine[] = [];
  const lines = yrcContent.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Line timestamp header: [12345,2300]
    const headerMatch = line.match(/^\[(\d+),(\d+)\](.*)/);
    if (headerMatch) {
      const lineStartMs = parseInt(headerMatch[1], 10);
      const syllables = headerMatch[3];

      // Extract words from (start,dur,0)word
      const wordRegex = /\((\d+),(\d+),\d+\)([^(]+)/g;
      const wordMatches: RegExpExecArray[] = [];
      let wm: RegExpExecArray | null;
      while ((wm = wordRegex.exec(syllables)) !== null) {
        wordMatches.push(wm);
      }

      if (wordMatches.length > 0) {
        const fullLineText = wordMatches.map((m) => m[3]).join("").trim();
        result.push({
          seconds: lineStartMs / 1000,
          lyrics: fullLineText,
        });
      }
    }
  }

  return result;
}
