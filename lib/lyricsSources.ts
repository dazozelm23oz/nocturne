export type LyricSourceId =
  | "lrclib"
  | "netease"
  | "spotify"
  | "kugou"
  | "musixmatch"
  | "genius";

export interface LyricSourceDefinition {
  id: LyricSourceId;
  name: string;
  shortName: string;
  description: string;
  supportsKaraoke: boolean;
  supportsLineSync: boolean;
  defaultPriority: number;
  karaokePriority: number;
  badge: string;
}

export const ALL_LYRIC_SOURCES: LyricSourceDefinition[] = [
  {
    id: "lrclib",
    name: "LRCLIB",
    shortName: "LRCLIB",
    description: "Open-source community database with millisecond-precision synced lyrics.",
    supportsKaraoke: true,
    supportsLineSync: true,
    defaultPriority: 1,
    karaokePriority: 4,
    badge: "Community LRC",
  },
  {
    id: "netease",
    name: "NetEase Cloud Music",
    shortName: "NetEase",
    description: "Massive global database with high-precision line sync and rich Asian & Western coverage.",
    supportsKaraoke: true,
    supportsLineSync: true,
    defaultPriority: 2,
    karaokePriority: 1,
    badge: "Word & Line Sync",
  },
  {
    id: "spotify",
    name: "Spotify Color Lyrics",
    shortName: "Spotify",
    description: "Official Spotify line-by-line and syllable-synced lyrics (requires SP_DC).",
    supportsKaraoke: true,
    supportsLineSync: true,
    defaultPriority: 3,
    karaokePriority: 2,
    badge: "Official Syllables",
  },
  {
    id: "kugou",
    name: "Kugou Music",
    shortName: "Kugou",
    description: "Extensive karaoke catalog with character-level and line-synced lyrics.",
    supportsKaraoke: true,
    supportsLineSync: true,
    defaultPriority: 4,
    karaokePriority: 3,
    badge: "Karaoke KRC",
  },
  {
    id: "musixmatch",
    name: "Musixmatch",
    shortName: "Musixmatch",
    description: "The world's largest lyrics catalog with synchronized subtitle lines.",
    supportsKaraoke: false,
    supportsLineSync: true,
    defaultPriority: 5,
    karaokePriority: 5,
    badge: "Global Subtitles",
  },
  {
    id: "genius",
    name: "Genius",
    shortName: "Genius",
    description: "Verified crowd-sourced lyrics and annotations (plain lyrics fallback).",
    supportsKaraoke: false,
    supportsLineSync: false,
    defaultPriority: 6,
    karaokePriority: 6,
    badge: "Plain Fallback",
  },
];

export const DEFAULT_LYRIC_SOURCES_PRIORITY: LyricSourceId[] = [
  "lrclib",
  "netease",
  "spotify",
  "kugou",
  "musixmatch",
  "genius",
];

export const DEFAULT_KARAOKE_SOURCES_PRIORITY: LyricSourceId[] = [
  "lrclib",
  "netease",
  "spotify",
  "kugou",
];

/**
 * Reads user's current source priorities from localStorage and generates URL search parameters
 */
export function getLyricsSourcesQueryParams(preferKaraoke: boolean = true): string {
  if (typeof window === "undefined") {
    return `&preferKaraoke=${preferKaraoke}`;
  }

  try {
    const raw = localStorage.getItem("apple_music_lyrics_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      const sources = Array.isArray(parsed.lyricSourcesPriority)
        ? parsed.lyricSourcesPriority.join(",")
        : DEFAULT_LYRIC_SOURCES_PRIORITY.join(",");
      const karaokeSources = Array.isArray(parsed.karaokeSourcesPriority)
        ? parsed.karaokeSourcesPriority.join(",")
        : DEFAULT_KARAOKE_SOURCES_PRIORITY.join(",");
      const disabled = Array.isArray(parsed.disabledLyricSources)
        ? parsed.disabledLyricSources.join(",")
        : "";

      return `&sources=${encodeURIComponent(sources)}&karaokeSources=${encodeURIComponent(
        karaokeSources
      )}&disabled=${encodeURIComponent(disabled)}&preferKaraoke=${preferKaraoke}`;
    }
  } catch {}

  return `&sources=${encodeURIComponent(
    DEFAULT_LYRIC_SOURCES_PRIORITY.join(",")
  )}&karaokeSources=${encodeURIComponent(
    DEFAULT_KARAOKE_SOURCES_PRIORITY.join(",")
  )}&preferKaraoke=${preferKaraoke}`;
}
