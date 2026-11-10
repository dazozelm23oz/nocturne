import { LyricProvider, LyricFetchParams, LyricProviderResult } from "./types";
import { resilientFetchJson } from "../resilientFetch";

export const geniusProvider: LyricProvider = {
  id: "genius",
  name: "Genius",
  supportsKaraoke: false,

  async fetch({ track, artist = "", signal }: LyricFetchParams): Promise<LyricProviderResult | null> {
    const cleanTrack = (track || "").trim();
    const query = `${cleanTrack} ${artist}`.trim();

    try {
      const searchUrl = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(query)}`;
      const searchRes = await resilientFetchJson<any>(searchUrl, {
        timeoutMs: 2500,
        retries: 0,
        signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        silent: true,
      });

      if (!searchRes.ok || !searchRes.data?.response?.sections) return null;

      const hitSection = searchRes.data.response.sections.find((s: any) => s.type === "song");
      const topHit = hitSection?.hits?.[0]?.result;

      if (topHit && topHit.path) {
        // Fetch HTML and extract text from lyrics container
        const pageUrl = `https://genius.com${topHit.path}`;
        const pageRes = await fetch(pageUrl, {
          signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          // Extract text from data-lyrics-container="true"
          const containerRegex = /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
          let match: RegExpExecArray | null;
          let fullLyrics = "";

          while ((match = containerRegex.exec(html)) !== null) {
            let chunk = match[1];
            chunk = chunk.replace(/<br\s*\/?>/gi, "\n");
            chunk = chunk.replace(/<[^>]+>/g, "");
            chunk = chunk.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
            fullLyrics += chunk + "\n\n";
          }

          const trimmed = fullLyrics.trim();
          if (trimmed.length > 50) {
            return {
              lyrics: trimmed,
              synced: false,
              source: "genius",
            };
          }
        }
      }
    } catch {}

    return null;
  },
};
