/**
 * Comprehensive Track Variant Detection & Two-Phase Search Engine
 * 
 * When a song has a modifier ("slowed", "reverb", "remix", "sped up", "nightcore", etc.),
 * Nocturne will:
 * 1. Search for that EXACT modified variant first across all prioritized lyric & karaoke sources.
 * 2. If NO source returns lyrics for the modified version, automatically fall back to the default/clean song name.
 */

export interface TrackVariantInfo {
  originalTrack: string;
  hasVariant: boolean;
  baseTrack: string;
  variantTag?: string;
  searchCandidates: string[];
}

const VARIANT_PATTERNS = [
  // Slowed & Reverb variants
  /\b(?:slowed(?:\s*(?:\+|&|and)\s*reverb)?|reverb(?:ed)?|slowed\s+down)\b/i,
  // Sped up & Fast variants
  /\b(?:sped\s*up|speed\s*up|speedup|fast\s*version|nightcore|daycore)\b/i,
  // Remix & Club variants
  /\b(?:remix|club\s*mix|extended(?:\s*mix)?|vip(?:\s*remix)?|dance\s*mix|synthwave\s*remix|lo-?fi\s*remix)\b/i,
  // Acoustic & Live & Version variants
  /\b(?:acoustic(?:\s*version)?|unplugged|live(?:\s+at|\s+from)?|stripped|orchestral)\b/i,
  // Instrumental & Edit variants
  /\b(?:instrumental|karaoke|radio\s*edit|slowed\s*edit|edit)\b/i,
];

/**
 * Checks if a string contains any track variant keyword
 */
export function hasVariantKeyword(text: string): boolean {
  if (!text) return false;
  return VARIANT_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Strips title pollution commonly produced by desktop players, web wrappers, or YouTube Music
 * (e.g. "Song Name | YouTube Music", "Song Name - Official Audio", "Song Name - YouTube").
 */
export function cleanTrackTitle(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let title = raw.trim();

  // 1. Strip pipe and anything after it: "Song Name | YouTube Music" -> "Song Name"
  if (title.includes("|")) {
    title = title.split("|")[0].trim();
  }

  // 2. Strip common platform, video, or uploader noise after dash or pipe
  title = title
    .replace(
      /\s*[-–—]\s*(?:YouTube(?:\s*Music)?|Spotify|Apple\s*Music|Topic|Official(?:\s*Music)?\s*Video|Official\s*Audio|Lyric(?:\s*Video)?|Audio|Video).*$/i,
      ""
    )
    .trim();

  return title;
}

/**
 * Sanitizes track title and artist specifically for music API searches (HQ search, lyrics, etc.).
 * 1. Strips pipe and platform pollution.
 * 2. If artist is empty but title contains 'Artist - Title', splits them.
 * 3. Strips parentheticals and bracketed tags like (Lyrics), (Official Video), (From "Movie").
 * 4. Filters out platform branding as artist (e.g. "YouTube Music").
 * 5. Generates core fallback query (first 3 words).
 */
export function sanitizeTrackForSearch(
  rawTitle: string,
  rawArtist: string = ""
): { title: string; artist: string; fallbackTitle: string } {
  let title = cleanTrackTitle(rawTitle);
  let artist = cleanTrackTitle(rawArtist);

  // If artist is platform branding, disregard it
  if (/^(?:YouTube(?:\s*Music)?|Spotify|Apple\s*Music|Topic|Various\s*Artists)$/i.test(artist.trim())) {
    artist = "";
  }

  // If artist is empty, but title contains a dash (e.g. "DNCE - Cake By The Ocean")
  if (!artist && /[-–—]/.test(title)) {
    const parts = title.split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }
  } else if (!artist) {
    // If the title is just "U Werent Here I Really Miss You" with no hyphen,
    // strip any text after words like "(feat.", "-", or "|". Pass the stripped title as BOTH title and artist.
    const stripped = title
      .replace(/\s*(\((?:feat\.?|ft\.?).*?\)|\b(?:feat\.?|ft\.?)\b.*|[-–—|].*)$/i, "")
      .trim();
    title = stripped || title;
    artist = stripped || title;
  }

  // Strip out anything in parentheses or brackets: (Lyrics), (Official Video), (From 'Movie'), etc.
  title = title
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/["'“”]/g, "")
    .trim();

  artist = artist
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/["'“”]/g, "")
    .trim();

  // If title became empty after stripping, revert to cleanTrackTitle
  if (!title) {
    title = cleanTrackTitle(rawTitle);
  }

  // Generate fallback: first 3 words of song title
  const words = title.split(/\s+/).filter(Boolean);
  const fallbackTitle = words.slice(0, 3).join(" ");

  return { title, artist, fallbackTitle };
}

/**
 * Analyzes a track title and returns structured variant information
 * along with an ordered list of search candidates (variant first, fallback base second).
 */
export function analyzeTrackTitle(title: string): TrackVariantInfo {
  if (!title || typeof title !== "string") {
    return {
      originalTrack: "",
      hasVariant: false,
      baseTrack: "",
      searchCandidates: [""],
    };
  }

  // First apply platform pollution cleaning
  const sanitized = cleanTrackTitle(title) || title.trim();
  const trimmed = sanitized;
  const searchCandidates: string[] = [];

  // Check if title has any variant keyword
  const containsVariant = hasVariantKeyword(trimmed);

  // Extract base track name by peeling away modifiers:
  // 1. Suffixes with " - ..." like "Song Name - Slowed + Reverb" or "Song Name - Remix"
  // 2. Parentheses "(...)" like "Song Name (Slowed + Reverb)" or "Song Name (Remix)"
  // 3. Brackets "[...]" like "Song Name [Slowed + Reverb]"
  let base = trimmed;
  let detectedTag: string | undefined;

  // Check dash suffix: e.g. "Song - Slowed + Reverb"
  const dashMatch = trimmed.match(/^(.*?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    const prefix = dashMatch[1].trim();
    const suffix = dashMatch[2].trim();
    if (hasVariantKeyword(suffix)) {
      base = prefix;
      detectedTag = suffix;
    }
  }

  // Check parenthetical: e.g. "Song (Slowed + Reverb)" or "Song (Remix)"
  const parenMatch = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const prefix = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    if (hasVariantKeyword(inside)) {
      base = prefix;
      detectedTag = inside;
    }
  }

  // Check bracketed: e.g. "Song [Slowed + Reverb]"
  const bracketMatch = trimmed.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
  if (bracketMatch) {
    const prefix = bracketMatch[1].trim();
    const inside = bracketMatch[2].trim();
    if (hasVariantKeyword(inside)) {
      base = prefix;
      detectedTag = inside;
    }
  }

  // Clean remaining feat / ft suffixes from base if present
  base = base
    .replace(/\s*\((?:feat\.?|ft\.?)\s+[^)]+\)/gi, "")
    .replace(/\s*\[(?:feat\.?|ft\.?)\s+[^\]]+\]/gi, "")
    .replace(/\s*[-–—]\s*(?:feat\.?|ft\.?)\s+.+$/gi, "")
    .trim();

  // If base ended up empty (rare), revert to original
  if (!base) base = trimmed;

  const hasVariant = containsVariant && base.toLowerCase() !== trimmed.toLowerCase();

  if (hasVariant) {
    // 1st Priority: Exact Modified Track Name
    searchCandidates.push(trimmed);

    // Alternative common format: e.g., if "Song - Remix", also try "Song (Remix)"
    if (detectedTag) {
      const altFormat = `${base} (${detectedTag})`;
      if (altFormat.toLowerCase() !== trimmed.toLowerCase()) {
        searchCandidates.push(altFormat);
      }
    }

    // 2nd Priority (Fallback): Default / Clean Song Name
    searchCandidates.push(base);
  } else {
    // No variant: single search candidate
    searchCandidates.push(trimmed);

    // If title has other parentheticals, provide clean version as fallback
    const stripped = trimmed.replace(/\s*[\(\[].*?[\)\]]/g, "").trim();
    if (stripped && stripped.toLowerCase() !== trimmed.toLowerCase()) {
      searchCandidates.push(stripped);
    }
  }

  // Remove duplicate candidates while preserving order
  const uniqueCandidates = Array.from(new Set(searchCandidates.filter(Boolean)));

  return {
    originalTrack: trimmed,
    hasVariant,
    baseTrack: base,
    variantTag: detectedTag,
    searchCandidates: uniqueCandidates,
  };
}
