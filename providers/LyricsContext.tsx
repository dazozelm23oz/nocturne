import { Karoke, Lyric, PlainLyrics, SyncedLyrics } from "@/typings/Lyrics";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSong, useTime, useOptimisticPlayback } from "./SongContext";
import useInterval from "@/lib/useInterval";
import { extractAndRemoveParentheses } from "@/lib/extract";
import { recordMetric } from "@/lib/performanceMetrics";
import { prewarmQueue, sharedLyricsCache } from "@/lib/queuePrefetchCoordinator";
import { getLyricsSourcesQueryParams } from "@/lib/lyricsSources";
import { cleanTrackTitle, sanitizeTrackForSearch } from "@/lib/trackVariants";

const lyricsCache = new Map<string, SyncedLyrics | PlainLyrics>();

const LyricContext = createContext<SyncedLyrics | PlainLyrics | null>(null);
const CurrentContext = createContext<Karoke | null>(null);

export function useLyrics() {
  return useContext(LyricContext);
}

export function useKaroke() {
  return useContext(CurrentContext);
}

export function LyricsProvider({ children }: { children: ReactNode }) {
  const song = useSong();
  const currentTime = useTime();
  const { queue } = useOptimisticPlayback();

  const [lyric, setLyric] = useState<SyncedLyrics | PlainLyrics | null>(null);
  const [current, setCurrent] = useState<Karoke | null>(null);
  const [prevSong, setPrevSong] = useState<string>("");

  const activeIdxRef = useRef<number>(-1);
  const prevSongUriRef = useRef<string>("");

  // Reset active index tracking on song change
  useEffect(() => {
    const songKey = song?.uri || song?.name || "";
    if (songKey !== prevSongUriRef.current) {
      activeIdxRef.current = -1;
      prevSongUriRef.current = songKey;
    }
  }, [song?.uri, song?.name]);

  useInterval(() => {
    if (lyric && lyric.synced && Array.isArray(lyric.lyrics) && lyric.lyrics.length > 0) {
      let targetIdx = -1;
      for (let i = 0; i < lyric.lyrics.length; i++) {
        if (currentTime >= lyric.lyrics[i].seconds) {
          targetIdx = i;
        } else {
          break;
        }
      }

      // Hysteresis & Anti-Jitter Guard:
      // If targetIdx would regress backwards (e.g. from line 2 back to line 1),
      // only allow it if currentTime is genuinely earlier than the line start (> 0.75s seek).
      // This eliminates backward line jumps near boundaries when line 2 is still singing.
      const prevIdx = activeIdxRef.current;
      if (prevIdx !== -1 && targetIdx < prevIdx && targetIdx !== -1) {
        const activeLineStart = lyric.lyrics[prevIdx]?.seconds ?? 0;
        if (currentTime >= activeLineStart - 0.75) {
          targetIdx = prevIdx;
        }
      }

      activeIdxRef.current = targetIdx;

      if (targetIdx !== -1 && lyric.lyrics[targetIdx]) {
        const cur = lyric.lyrics[targetIdx];
        const rawText = cur?.lyrics ?? "";
        const [ext, clean] = extractAndRemoveParentheses(
          rawText === "" ? "..." : rawText
        );
        setCurrent({
          index: targetIdx,
          lyric: { seconds: cur?.seconds ?? 0, lyrics: clean.toString() },
        });
      } else {
        setCurrent(null);
      }
    }
  }, 35);

  // Intelligent Background Queue Pre-fetching (artwork, palette, and lyrics)
  useEffect(() => {
    if (queue && queue.length > 0) {
      prewarmQueue(queue);
    }
  }, [queue]);

  useEffect(() => {
    if (song && song.name && prevSong !== (song.uri || song.name)) {
      const key = song.uri || song.name;
      const nameKey = song.name;
      setCurrent(null);
      activeIdxRef.current = -1;

      // Instant cache hit: 0ms load from memory or prewarm cache!
      const cached =
        lyricsCache.get(key) ||
        lyricsCache.get(nameKey) ||
        sharedLyricsCache.get(key) ||
        sharedLyricsCache.get(nameKey);

      if (cached) {
        recordMetric("lyrics_load", 0.1, { cached: true });
        setLyric(cached);
        setPrevSong(key);
        lyricsCache.set(key, cached);
        return;
      }

      setLyric(null);
      const trackId =
        song.id || (song.uri ? song.uri.replace("spotify:track:", "") : "");
      const sourcesParams = getLyricsSourcesQueryParams(true);
      const fetchStart = typeof performance !== "undefined" ? performance.now() : Date.now();
      const sanitized = sanitizeTrackForSearch(song.name, song.artist || "");
      const cleanTitle = sanitized.title || cleanTrackTitle(song.name);
      const cleanArtist = sanitized.artist || cleanTrackTitle(song.artist || "");

      fetch(
        `/api/lyrics?track=${encodeURIComponent(
          cleanTitle.split(",").join("")
        )}&artist=${encodeURIComponent(cleanArtist)}&album=${encodeURIComponent(
          song.album || ""
        )}&trackId=${encodeURIComponent(trackId)}${sourcesParams}`
      )
        .then((res) => res.json())
        .then((d: SyncedLyrics | PlainLyrics) => {
          const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - fetchStart;
          recordMetric("lyrics_load", elapsed, { cached: (d as any)?.cached });
          setLyric(d);
          lyricsCache.set(key, d);
          setPrevSong(key);
        })
        .catch((a) => {
          console.warn("Failed to fetch lyrics:", a);
        });
    }
  }, [song, prevSong]);

  // Handle live source priority changes or song-specific overrides
  useEffect(() => {
    const handleSourceChanged = () => {
      lyricsCache.clear();
      sharedLyricsCache.clear();
      setPrevSong(""); // trigger re-fetch with new sources
    };

    const handleSongSourceOverride = (e: any) => {
      const { source, preferKaraoke } = e?.detail || {};
      if (!song || !source) return;
      const key = song.uri || song.name;
      setLyric(null);
      setCurrent(null);
      activeIdxRef.current = -1;

      const trackId =
        song.id || (song.uri ? song.uri.replace("spotify:track:", "") : "");
      const isKaraoke = preferKaraoke !== undefined ? preferKaraoke : true;

      const sanitized = sanitizeTrackForSearch(song.name, song.artist || "");
      const cleanTitle = sanitized.title || cleanTrackTitle(song.name);
      const cleanArtist = sanitized.artist || cleanTrackTitle(song.artist || "");

      fetch(
        `/api/lyrics?track=${encodeURIComponent(
          cleanTitle.split(",").join("")
        )}&artist=${encodeURIComponent(cleanArtist)}&album=${encodeURIComponent(
          song.album || ""
        )}&trackId=${encodeURIComponent(trackId)}&forceSource=${encodeURIComponent(
          source
        )}&preferKaraoke=${isKaraoke}&bypassCache=true`
      )
        .then((res) => res.json())
        .then((d: SyncedLyrics | PlainLyrics) => {
          setLyric(d);
          lyricsCache.set(key, d);
          setPrevSong(key);
        })
        .catch((err) => {
          console.warn("Failed to apply song source override:", err);
        });
    };

    window.addEventListener("lyrics_sources_changed", handleSourceChanged);
    window.addEventListener("song_source_override", handleSongSourceOverride);
    return () => {
      window.removeEventListener("lyrics_sources_changed", handleSourceChanged);
      window.removeEventListener("song_source_override", handleSongSourceOverride);
    };
  }, [song]);

  return (
    <LyricContext.Provider value={lyric}>
      <CurrentContext.Provider value={current}>
        {children}
      </CurrentContext.Provider>
    </LyricContext.Provider>
  );
}
