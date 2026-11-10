import { Song } from "@/typings/Song";
import { PaletteAlgorithmOption } from "@/typings/LyricsSettings";
import { extractPalette } from "./paletteExtractor";
import { getLyricsSourcesQueryParams } from "./lyricsSources";

// Track pre-warm state tracker to avoid redundant network / extraction work
const prewarmedTrackKeys = new Set<string>();
const prewarmedImages = new Map<string, HTMLImageElement>();
export const sharedLyricsCache = new Map<string, any>();
let isPrewarming = false;

export interface PrewarmProgress {
  total: number;
  completed: number;
  currentTrack?: string;
}

/**
 * Pre-warms a single track:
 * 1. Pre-fetches and pre-decodes the album artwork image into browser memory
 * 2. Pre-extracts the color palette (M3 tonal & dominant colors) into memory cache
 * 3. Pre-fetches and caches the synchronized lyrics via /api/lyrics into memory & persistent storage
 */
export async function prewarmSingleTrack(
  track: Song,
  algorithm: PaletteAlgorithmOption = "Auto (Beta)"
): Promise<void> {
  if (!track || !track.name || !track.artist) return;

  const key = track.uri || `${track.name}_${track.artist}`;
  const nameKey = track.name;

  if (prewarmedTrackKeys.has(key)) return;

  try {
    // 1. Pre-decode Album Artwork in browser memory cache
    if (typeof window !== "undefined" && track.image && !prewarmedImages.has(track.image)) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = track.image;
      if ("decode" in img) {
        img.decode().catch(() => {});
      }
      prewarmedImages.set(track.image, img);

      // 2. Pre-extract Color Palette (runs canvas extraction & caches in memory)
      extractPalette(track.image, algorithm).catch(() => {});
    }

    // 3. Pre-fetch Synchronized Lyrics into API, disk persistent cache & shared in-memory cache
    if (!sharedLyricsCache.has(key) && !sharedLyricsCache.has(nameKey)) {
      const trackId = track.id || (track.uri ? track.uri.replace("spotify:track:", "") : "");
      const cleanTrack = track.name.split(",").join("");
      const sourcesParams = getLyricsSourcesQueryParams(true);
      const url = `/api/lyrics?track=${encodeURIComponent(cleanTrack)}&artist=${encodeURIComponent(
        track.artist
      )}&album=${encodeURIComponent(track.album || "")}&trackId=${encodeURIComponent(trackId)}${sourcesParams}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.synced || data.lyrics)) {
          sharedLyricsCache.set(key, data);
          sharedLyricsCache.set(nameKey, data);
        }
      }
    }

    prewarmedTrackKeys.add(key);
  } catch (err) {
    // Silent fail for offline / transient network
  }
}

/**
 * Pre-warms upcoming songs from the queue (up to maxTracks).
 * Uses requestIdleCallback / setTimeout yielding to avoid dropping UI frames during active audio playback.
 */
export async function prewarmQueue(
  queue: Song[],
  algorithm: PaletteAlgorithmOption = "Auto (Beta)",
  maxTracks: number = 4
): Promise<void> {
  if (!queue || queue.length === 0 || isPrewarming) return;
  isPrewarming = true;

  try {
    const tracksToWarm = queue.slice(0, maxTracks);

    for (let i = 0; i < tracksToWarm.length; i++) {
      const track = tracksToWarm[i];
      if (!track) continue;

      const key = track.uri || `${track.name}_${track.artist}`;
      if (prewarmedTrackKeys.has(key)) continue;

      // Yield execution to the browser to maintain 60 FPS
      await new Promise<void>((resolve) => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(() => resolve(), { timeout: 350 });
        } else {
          setTimeout(resolve, 150);
        }
      });

      await prewarmSingleTrack(track, algorithm);
    }
  } finally {
    isPrewarming = false;
  }
}

/**
 * Check if a track is already warm in memory
 */
export function isTrackPrewarmed(track: Song | null): boolean {
  if (!track) return false;
  const key = track.uri || `${track.name}_${track.artist}`;
  return prewarmedTrackKeys.has(key);
}
