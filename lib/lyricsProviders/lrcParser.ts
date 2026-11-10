import { LyricLine } from "./types";

export function parseLrcString(lrcContent: string): LyricLine[] {
  if (!lrcContent || typeof lrcContent !== "string") return [];

  const lines = lrcContent.split(/\r?\n/);
  const result: LyricLine[] = [];
  const pattern = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\](.*)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for ID tags: [ti:], [ar:], [al:], [by:], [offset:]
    if (/^\[(ti|ar|al|by|offset|length|re|ve|hash):/i.test(trimmed)) {
      continue;
    }

    // Handle lines with multiple timestamp prefixes like: [00:12.34][01:23.45]Lyrics
    const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    const timeMatches: RegExpExecArray[] = [];
    let tm: RegExpExecArray | null;
    while ((tm = timeRegex.exec(trimmed)) !== null) {
      timeMatches.push(tm);
    }

    if (timeMatches.length > 0) {
      const text = trimmed.replace(/\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/g, "").trim();
      for (const m of timeMatches) {
        const mins = parseInt(m[1], 10);
        const secs = parseInt(m[2], 10);
        const fracStr = m[3] || "0";
        const fraction = parseInt(fracStr, 10) / Math.pow(10, fracStr.length);
        const totalSeconds = mins * 60 + secs + fraction;
        result.push({
          seconds: totalSeconds,
          lyrics: text,
        });
      }
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.seconds - b.seconds);
  return result;
}
