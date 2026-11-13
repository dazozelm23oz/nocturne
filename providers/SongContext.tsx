import msTosec from "@/lib/msTosec";
import useInterval from "@/lib/useInterval";
import { Data } from "@/typings/Position";
import { Song } from "@/typings/Song";
import { useSession, signOut, signIn } from "next-auth/react";
import { prewarmQueue, prewarmSingleTrack } from "@/lib/queuePrefetchCoordinator";
const getLocalPlaybackState = async (_p?: string): Promise<any> => null;
const sendLocalMediaCommand = async (_cmd: string, _p?: string): Promise<void> => {};
const seekLocalMedia = async (_ms: number, _p?: string): Promise<void> => {};
const getArtworkForTrack = async (_title: string, _artist?: string): Promise<string | undefined> => undefined;
import { cleanTrackTitle, sanitizeTrackForSearch } from "@/lib/trackVariants";
import { invoke } from "@tauri-apps/api/core";
import {
  isHqAudioActive,
  getHqPlaybackTime,
  pauseHqAudio,
  resumeHqAudio,
  seekHqAudio,
} from "@/lib/useHqPlayback";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

function getPreferredMediaPlayer(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("apple_music_lyrics_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.preferredMediaPlayer && parsed.preferredMediaPlayer !== "auto") {
        return parsed.preferredMediaPlayer;
      }
    }
  } catch {}
  return undefined;
}

function parseMprisRawOutput(output: string) {
  if (!output || !output.trim() || output.includes("No player could handle this command")) {
    return null;
  }
  const parts = output.trim().split("|");
  if (parts.length < 3) return null;

  // The last 3 segments are ALWAYS [status, position_us, length_us]
  let lenStr = "0";
  let posStr = "0";
  let status = "Playing";
  let artist = "";
  let rawTitle = "";

  if (parts.length >= 5) {
    lenStr = parts[parts.length - 1];
    posStr = parts[parts.length - 2];
    status = parts[parts.length - 3];
    artist = parts[parts.length - 4];
    rawTitle = parts.slice(0, parts.length - 4).join("|");
  } else {
    rawTitle = parts[0];
    artist = parts[1] || "";
    status = parts[2] || "Playing";
    posStr = parts[3] || "0";
    lenStr = parts[4] || "0";
  }

  const sanitized = sanitizeTrackForSearch(rawTitle, artist);
  const cleanTitle = sanitized.title;
  const cleanArtist = sanitized.artist;

  const posUs = parseInt(posStr || "0", 10);
  const lenUs = parseInt(lenStr || "0", 10);
  const positionMs = isNaN(posUs) ? 0 : Math.round(posUs / 1000);
  const durationMs = isNaN(lenUs) ? 0 : Math.round(lenUs / 1000);
  const isPlaying = (status || "").trim().toLowerCase() === "playing";

  return {
    title: cleanTitle || rawTitle.trim(),
    artist: cleanArtist,
    status,
    isPlaying,
    positionMs,
    durationMs,
  };
}

const SongContext = createContext<Song | null>(null);
const TimeContext = createContext<number>(0);
const SpotifyDataContext = createContext<Data | null>(null);
const RefetchContext = createContext<(rapid?: boolean, explicitData?: any) => void>(() => {});

export interface OptimisticPlayback {
  skipNext: () => Promise<void>;
  skipPrev: (currentTimeSec: number) => Promise<void>;
  seekTo: (targetSeconds: number) => Promise<void>;
  togglePlayPause: (pauseOverride?: boolean) => Promise<void>;
  queue: Song[];
  history: Song[];
}

const OptimisticPlaybackContext = createContext<OptimisticPlayback>({
  skipNext: async () => {},
  skipPrev: async () => {},
  seekTo: async () => {},
  togglePlayPause: async (_?: boolean) => {},
  queue: [],
  history: [],
});

export function useSong() {
  return useContext(SongContext);
}

export function useSpotify() {
  return useContext(SpotifyDataContext);
}

export function useTime() {
  return useContext(TimeContext);
}

export function useRefetchSong() {
  return useContext(RefetchContext);
}

export function useOptimisticPlayback() {
  return useContext(OptimisticPlaybackContext);
}

function formatSongItem(item: any): Song {
  return {
    id: item.id || "",
    album: item.album?.name || "",
    albumId: item.album?.id,
    image: item.album?.images?.[0]?.url || "",
    name: item.name || "",
    artist: item.artists?.map((a: any) => a.name).join(", ") || "",
    artistId: item.artists?.[0]?.id,
    uri: item.uri || "",
    duration: item.duration_ms || 0,
    explicit: Boolean(item.explicit),
    externalUrl: item.external_urls?.spotify,
  };
}

export function SongProvider({ children }: { children: ReactNode }) {
  const [song, setSong] = useState<Song | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);

  const [data, setData] = useState<any>(null);
  const { data: session, status } = useSession();

  const songRef = useRef<Song | null>(song);
  songRef.current = song;

  const dataRef = useRef<any>(data);
  dataRef.current = data;

  const queueRef = useRef<Song[]>(queue);
  queueRef.current = queue;

  const historyRef = useRef<Song[]>(history);
  historyRef.current = history;

  // Locks to prevent Spotify's stale polling responses from bouncing the UI
  const skipLockRef = useRef<{ timestamp: number; expectedUri: string | null }>({
    timestamp: 0,
    expectedUri: null,
  });

  const seekLockRef = useRef<{ timestamp: number; expectedMs: number | null }>({
    timestamp: 0,
    expectedMs: null,
  });

  const playPauseLockRef = useRef<{ timestamp: number; expectedPlaying: boolean | null }>({
    timestamp: 0,
    expectedPlaying: null,
  });

  useInterval(
    () => {
      if (!song?.name) {
        setCurrent(0);
        return;
      }

      if (data) {
        // If native HQ audio is actively playing, use its high-precision currentTime clock
        const hqTime = getHqPlaybackTime();
        if (hqTime !== null && isHqAudioActive()) {
          setCurrent(hqTime);
          return;
        }

        if (!data.is_playing) {
          setCurrent(msTosec(data.progress_ms));
          return;
        }

        const elapsed = Math.max(0, Date.now() - data.timestamp);
        const progressMs = data.progress_ms + elapsed;
        const currentSec = msTosec(progressMs);

        const isUserSeeking = Date.now() - seekLockRef.current.timestamp < 2500;
        const isUserSkipping = Date.now() - skipLockRef.current.timestamp < 3500;

        setCurrent((prevSec) => {
          // If actively playing and not mid-seek/skip, prevent backwards jumps within 2 seconds
          if (!isUserSeeking && !isUserSkipping) {
            if (currentSec < prevSec && prevSec - currentSec < 2.0 && prevSec > 0.05) {
              return prevSec + 0.05;
            }
          }
          return currentSec;
        });

        // Proactive Pre-warm: When current song is within 35 seconds of finishing,
        // pre-warm next track so transition is 100% instantaneous with 0ms delay.
        if (song?.duration && queueRef.current.length > 0) {
          const remainingSec = song.duration / 1000 - currentSec;
          if (remainingSec <= 35 && remainingSec > 0) {
            prewarmSingleTrack(queueRef.current[0]);
          }
        }
      }
    },
    song?.name ? 50 : 1000
  );

  const fetchQueue = useCallback(() => {
    fetch("/api/spotify/queue")
      .then((res) => {
        if (!res.ok) throw new Error("queue error");
        return res.json();
      })
      .then((d) => {
        if (Array.isArray(d?.queue) && d.queue.length > 0) {
          const formatted = d.queue.map(formatSongItem);
          setQueue(formatted);
          // Pre-warm banner images, palettes, and lyrics ahead of time
          prewarmQueue(formatted);
        }
      })
      .catch(() => {});
  }, []);

  const handlePlaybackData = useCallback((playbackData: any) => {
    if (!playbackData?.item) return;
    const item = playbackData.item;
    const now = Date.now();

    let progressMs = playbackData.progress_ms || 0;

    // 1. SKIP RECONCILIATION GUARD
    // If user skipped recently, Spotify cloud API may still report the OLD song for 1-2s.
    // Discard any response returning the old track!
    if (now - skipLockRef.current.timestamp < 3500 && skipLockRef.current.expectedUri) {
      if (item.uri !== skipLockRef.current.expectedUri) {
        return; // Ignore stale pre-skip song!
      }
      // Spotify confirmed new song!
      // If Spotify reports progress_ms less than elapsed since optimistic skip, preserve local progression
      const elapsedSinceSkip = now - skipLockRef.current.timestamp;
      if (playbackData.is_playing && progressMs < elapsedSinceSkip) {
        progressMs = elapsedSinceSkip;
        playbackData.progress_ms = progressMs;
      }
      skipLockRef.current = { timestamp: 0, expectedUri: null };
    }

    // 2. SEEK RECONCILIATION GUARD
    // If user sought recently, Spotify cloud API may still report the OLD position for 1-2s.
    if (now - seekLockRef.current.timestamp < 2500 && seekLockRef.current.expectedMs !== null) {
      const diff = Math.abs(progressMs - seekLockRef.current.expectedMs);
      if (diff > 3500) {
        // Spotify is still returning the pre-seek position! Keep our optimistic progress!
        const elapsedSinceSeek = now - seekLockRef.current.timestamp;
        progressMs = seekLockRef.current.expectedMs + (playbackData.is_playing ? elapsedSinceSeek : 0);
        playbackData.progress_ms = progressMs;
      } else {
        // Spotify confirmed seek!
        seekLockRef.current = { timestamp: 0, expectedMs: null };
      }
    }

    // 2b. PLAY/PAUSE RECONCILIATION GUARD
    // If user clicked play or pause recently, server polling may return stale is_playing state for 1-3 seconds.
    // Lock the play state so it never jitters or toggles back to the old state.
    if (
      now - playPauseLockRef.current.timestamp < 3000 &&
      playPauseLockRef.current.expectedPlaying !== null
    ) {
      if (playbackData.is_playing !== playPauseLockRef.current.expectedPlaying) {
        playbackData.is_playing = playPauseLockRef.current.expectedPlaying;
      } else {
        // Confirmed by Spotify
        playPauseLockRef.current = { timestamp: 0, expectedPlaying: null };
      }
    }

    playbackData.timestamp = now;
    setData(playbackData);
    const currentSong = songRef.current;
    const itemName = (item.name || "").trim().toLowerCase();
    const isGenericOrAd =
      !itemName ||
      itemName === "youtube music" ||
      itemName === "spotify" ||
      itemName === "advertisement" ||
      itemName === "audio ad";

    // If the new title is "YouTube Music" or generic ad but we already have a valid song, hold previous state
    if (isGenericOrAd && currentSong && currentSong.name && currentSong.name.toLowerCase() !== "youtube music") {
      return;
    }

    if (!currentSong || currentSong?.uri !== item.uri) {
      if (currentSong && currentSong.uri && currentSong.uri !== item.uri) {
        setHistory((prev) =>
          [currentSong, ...prev.filter((s) => s.uri !== currentSong.uri)].slice(0, 20)
        );
      }
      setSong(formatSongItem(item));
      setCurrent(msTosec(progressMs));
    }
  }, []);

  const fetchPosition = useCallback(() => {
    
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const preferredPlayer = getPreferredMediaPlayer();
      getLocalPlaybackState(preferredPlayer).then((localMedia) => {
        // If native HQ audio is actively playing, keep playing
        if (isHqAudioActive()) {
          if (localMedia && localMedia.item) {
            localMedia.is_playing = true;
            handlePlaybackData(localMedia);
          }
          return;
        }

        // Only clear song state if MPRIS is truly stopped or no media player exists
        if (!localMedia || !localMedia.item) {
          setSong(null);
          setData(null);
          setCurrent(0);
          return;
        }

        // External seek / position drift snap:
        // If currentTime drifts from MPRIS progress by > 1.5s and user is not actively seeking, snap!
        const isUserSeeking = Date.now() - seekLockRef.current.timestamp < 2500;
        if (!isUserSeeking && localMedia.progress_ms !== undefined) {
          const mprisSec = msTosec(localMedia.progress_ms);
          setCurrent((prevSec) => {
            if (Math.abs(prevSec - mprisSec) > 1.5) {
              return mprisSec;
            }
            return prevSec;
          });
        }

        handlePlaybackData(localMedia);
      }).catch(console.warn);
      return;
    }
    if (session && status === "authenticated") {
      fetch("/api/spotify/pos", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((d: { data: Data; status: number }) => {
          if (d.status == 401) {
            signOut();
            setTimeout(() => {
              signIn("spotify");
            }, 2000);
          }
          if (d.data?.item) {
            handlePlaybackData(d.data);
          } else {
            setSong(null);
          }
        })
        .catch((err) => {
          console.error("Error polling spotify position", err);
        });
    }
  }, [session, status, handlePlaybackData]);

  const togglePlayPause = useCallback(async (pauseOverride?: boolean) => {
    const isPlaying = dataRef.current?.is_playing ?? false;
    const nextPlaying = pauseOverride !== undefined ? !pauseOverride : !isPlaying;
    const now = Date.now();

    playPauseLockRef.current = {
      timestamp: now,
      expectedPlaying: nextPlaying,
    };

    setData((prev: any) => (prev ? { ...prev, is_playing: nextPlaying, timestamp: now } : prev));

    const preferredPlayer = getPreferredMediaPlayer();

    if (isHqAudioActive()) {
      if (nextPlaying) {
        resumeHqAudio();
        if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          sendLocalMediaCommand("pause", preferredPlayer).catch(() => {});
        }
      } else {
        pauseHqAudio();
        if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          sendLocalMediaCommand("pause", preferredPlayer).catch(() => {});
        }
      }
    } else if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      sendLocalMediaCommand("playpause", preferredPlayer).catch(() => {});
    } else {
      fetch("/api/spotify/playback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ play: nextPlaying }),
      }).catch((err) => console.error("Toggle play/pause error:", err));
    }

    setTimeout(fetchPosition, 400);
  }, [fetchPosition]);

  const seekTo = useCallback(async (targetSeconds: number) => {
    const targetMs = Math.max(0, Math.round(targetSeconds * 1000));
    const now = Date.now();

    // Lock seek timestamp so polling does not overwrite
    seekLockRef.current = {
      timestamp: now,
      expectedMs: targetMs,
    };

    // Update time IMMEDIATELY (0ms)
    setCurrent(targetSeconds);

    setData((prev: any) =>
      prev
        ? {
            ...prev,
            progress_ms: targetMs,
            timestamp: now,
          }
        : {
            progress_ms: targetMs,
            timestamp: now,
            is_playing: true,
          }
    );

    if (isHqAudioActive()) {
      seekHqAudio(targetSeconds);
    }

    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const preferredPlayer = getPreferredMediaPlayer();
      seekLocalMedia(targetMs, preferredPlayer).catch(() => {});
    } else {
      // Fire API call asynchronously
      fetch("/api/spotify/seek", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: targetMs }),
      }).catch((err) => console.error("Seek error:", err));
    }
  }, []);

  const skipNextOptimistic = useCallback(async () => {
    const currentSong = songRef.current;
    const upcomingQueue = queueRef.current;
    const now = Date.now();

    if (upcomingQueue.length > 0) {
      const nextSong = upcomingQueue[0];
      if (currentSong) {
        setHistory((prev) =>
          [currentSong, ...prev.filter((s) => s.uri !== currentSong.uri)].slice(0, 20)
        );
      }
      setQueue((prev) => prev.slice(1));

      // Lock skip expected URI to avoid stale responses
      skipLockRef.current = {
        timestamp: now,
        expectedUri: nextSong.uri,
      };

      // 0ms INSTANT OPTIMISTIC TRANSITION
      setSong(nextSong);
      setCurrent(0);
      setData((prev: any) => ({
        ...prev,
        item: {
          id: nextSong.id,
          name: nextSong.name,
          duration_ms: nextSong.duration,
          uri: nextSong.uri,
          explicit: nextSong.explicit,
          album: {
            name: nextSong.album,
            id: nextSong.albumId,
            images: [{ url: nextSong.image }],
          },
          artists: [{ id: nextSong.artistId, name: nextSong.artist }],
        },
        progress_ms: 0,
        is_playing: true,
        timestamp: now,
      }));
    } else {
      skipLockRef.current = {
        timestamp: now,
        expectedUri: null,
      };
      setCurrent(0);
      setData((prev: any) => (prev ? { ...prev, progress_ms: 0, timestamp: now } : prev));
    }

    // Fire command
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      pauseHqAudio();
      const preferredPlayer = getPreferredMediaPlayer();
      sendLocalMediaCommand("next", preferredPlayer).catch(() => {});
    } else {
      fetch("/api/spotify/playback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: true }),
      }).catch((err) => console.error("Skip next error:", err));
    }

    setTimeout(fetchPosition, 500);
    setTimeout(fetchQueue, 800);
  }, [fetchPosition, fetchQueue]);

  const skipPrevOptimistic = useCallback(
    async (currentTimeSec: number) => {
      const now = Date.now();

      // If 3+ seconds in, rewind current track in-place and signal player!
      if (currentTimeSec > 3) {
        setCurrent(0);
        setData((prev: any) => (prev ? { ...prev, progress_ms: 0, timestamp: now } : prev));
        const preferredPlayer = getPreferredMediaPlayer();
        if (isHqAudioActive()) {
          seekHqAudio(0);
          if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
            sendLocalMediaCommand("pause", preferredPlayer).catch(() => {});
          }
        } else if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          seekLocalMedia(0, preferredPlayer).catch(() => {});
        } else {
          fetch("/api/spotify/playback", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ previous: true }),
          }).catch((err) => console.error("Skip prev error:", err));
        }

        [100, 300, 600, 1200].forEach((ms) => setTimeout(fetchPosition, ms));
        return;
      }

      const currentSong = songRef.current;
      const historyList = historyRef.current;

      if (historyList.length > 0) {
        const prevSong = historyList[0];
        setHistory((prev) => prev.slice(1));
        if (currentSong) {
          setQueue((prev) => [currentSong, ...prev]);
        }

        skipLockRef.current = {
          timestamp: now,
          expectedUri: prevSong.uri,
        };

        // 0ms INSTANT OPTIMISTIC TRANSITION
        setSong(prevSong);
        setCurrent(0);
        setData((prev: any) => ({
          ...prev,
          item: {
            id: prevSong.id,
            name: prevSong.name,
            duration_ms: prevSong.duration,
            uri: prevSong.uri,
            explicit: prevSong.explicit,
            album: {
              name: prevSong.album,
              id: prevSong.albumId,
              images: [{ url: prevSong.image }],
            },
            artists: [{ id: prevSong.artistId, name: prevSong.artist }],
          },
          progress_ms: 0,
          is_playing: true,
          timestamp: now,
        }));
      } else {
        skipLockRef.current = {
          timestamp: now,
          expectedUri: null,
        };
        setCurrent(0);
        setData((prev: any) => (prev ? { ...prev, progress_ms: 0, timestamp: now } : prev));
      }

      // Fire command
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        pauseHqAudio();
        const preferredPlayer = getPreferredMediaPlayer();
        sendLocalMediaCommand("prev", preferredPlayer).catch(() => {});
      } else {
        fetch("/api/spotify/playback", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previous: true }),
        }).catch((err) => console.error("Skip prev error:", err));
      }

      setTimeout(fetchPosition, 500);
      setTimeout(fetchQueue, 800);
    },
    [fetchPosition, fetchQueue, seekTo]
  );

  const refetch = useCallback(
    (rapid = false, explicitData?: any) => {
      if (explicitData?.item) {
        handlePlaybackData(explicitData);
        return;
      }
      fetchPosition();
      fetchQueue();
    },
    [fetchPosition, fetchQueue, handlePlaybackData]
  );

  useEffect(() => {
    fetchPosition();
    fetchQueue();

    const int = setInterval(() => {
      fetchPosition();
    }, 1000);

    const queueInt = setInterval(() => {
      fetchQueue();
    }, 30000);

    return () => {
      clearInterval(int);
      clearInterval(queueInt);
    };
  }, [fetchPosition, fetchQueue]);

  return (
    <RefetchContext.Provider value={refetch}>
      <OptimisticPlaybackContext.Provider
        value={{
          skipNext: skipNextOptimistic,
          skipPrev: skipPrevOptimistic,
          seekTo,
          togglePlayPause,
          queue,
          history,
        }}
      >
        <SpotifyDataContext.Provider value={data}>
          <SongContext.Provider value={song}>
            <TimeContext.Provider value={current}>{children}</TimeContext.Provider>
          </SongContext.Provider>
        </SpotifyDataContext.Provider>
      </OptimisticPlaybackContext.Provider>
    </RefetchContext.Provider>
  );
}
