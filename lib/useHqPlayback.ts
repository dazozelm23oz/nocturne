import { useState, useEffect, useRef, useCallback } from "react";
import { LyricsSettings, HqQualityOption } from "@/typings/LyricsSettings";
const sendLocalMediaCommand = async (_cmd: string, _player?: string): Promise<void> => {};
import { sanitizeTrackForSearch } from "@/lib/trackVariants";

let activeHqAudioElement: HTMLAudioElement | null = null;
let isHqActiveState = false;

export function getHqAudioElement(): HTMLAudioElement | null {
  return activeHqAudioElement;
}

export function isHqAudioActive(): boolean {
  return isHqActiveState && !!activeHqAudioElement;
}

export function getHqPlaybackTime(): number | null {
  if (activeHqAudioElement && isHqActiveState && !activeHqAudioElement.paused) {
    return activeHqAudioElement.currentTime;
  }
  return null;
}

export function pauseHqAudio(): void {
  if (activeHqAudioElement && !activeHqAudioElement.paused) {
    activeHqAudioElement.pause();
  }
}

export function resumeHqAudio(): Promise<void> | void {
  if (activeHqAudioElement && activeHqAudioElement.paused) {
    return activeHqAudioElement.play().catch(() => {});
  }
}

export function seekHqAudio(targetSeconds: number): void {
  if (activeHqAudioElement) {
    activeHqAudioElement.currentTime = targetSeconds;
  }
}

export interface HqTrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  source: string;
}

export interface HqPlaybackState {
  isActive: boolean;
  isPlaying: boolean;
  track: HqTrackInfo | null;
  resolvedQuality: string | null;
  resolvedSource: string | null;
  sourceLabel: string | null;
  downgradeNotice: string | null;
  analyserNode: AnalyserNode | null;
  error: string | null;
}

function qualityOptionToEnum(opt: HqQualityOption): string {
  switch (opt) {
    case "Standard (128k)":
      return "standard";
    case "High (320k)":
      return "high";
    case "Lossless (FLAC)":
      return "lossless";
    case "Hi-Res (24-bit FLAC)":
      return "hires";
    default:
      return "high";
  }
}

export function useHqPlayback(
  settings: LyricsSettings,
  currentSongTitle?: string,
  currentSongArtist?: string,
  onToast?: (msg: string) => void
) {
  const [playbackState, setPlaybackState] = useState<HqPlaybackState>({
    isActive: false,
    isPlaying: false,
    track: null,
    resolvedQuality: null,
    resolvedSource: null,
    sourceLabel: null,
    downgradeNotice: null,
    analyserNode: null,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastResolveTimeRef = useRef<number>(0);
  const currentTtlMsRef = useRef<number>(1200000);
  const currentTitleRef = useRef<string>("");
  const currentArtistRef = useRef<string>("");
  const activeRequestIdRef = useRef<number>(0);
  const skipFailuresRef = useRef<number>(0);
  const lastSkipTimeRef = useRef<number>(0);

  // Initialize Web Audio Graph once for the <audio> element
  const initAudioGraph = useCallback((audioEl: HTMLAudioElement) => {
    activeHqAudioElement = audioEl;

    // Fallback: If native audio playback encounters an error, resume the browser so user is not left in silence
    audioEl.onerror = () => {
      console.warn("HQ audio element encountered playback error. Resuming browser playback fallback.");
      skipFailuresRef.current += 1;
      if (skipFailuresRef.current > 3) {
        isHqActiveState = false;
        setPlaybackState((prev) => ({ ...prev, isPlaying: false, isActive: false, error: "HQ Audio failed 3 times. Falling back to browser." }));
        if (onToast) onToast("HQ Audio failed 3 times. Falling back to browser.");
        if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          sendLocalMediaCommand("play").catch(() => {});
        }
        return;
      }
      isHqActiveState = false;
      setPlaybackState((prev) => ({ ...prev, isPlaying: false, isActive: false, error: "Audio playback error" }));
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        sendLocalMediaCommand("play").catch(() => {});
      }
    };

    // Auto-skip when song ends
    audioEl.onended = async () => {
      skipFailuresRef.current = 0;
      isHqActiveState = false;
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        try {
          await sendLocalMediaCommand("next");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mpris_track_advance"));
          }
        } catch (e) {
          console.warn("Auto-skip on HQ audio ended error:", e);
        }
      }
    };

    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      mediaSourceRef.current = source;

      setPlaybackState((prev) => ({ ...prev, analyserNode: analyser }));
    } catch (e) {
      console.warn("Failed to init Web Audio Graph for HQ audio:", e);
    }
  }, []);

  const resolveAndPlayHq = useCallback(
    async (title: string, artist: string, requestId?: number) => {
      if (!settings.hqAudioEnabled || typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) {
        return;
      }

      const reqId = requestId ?? ++activeRequestIdRef.current;
      activeRequestIdRef.current = reqId;

      try {
        const { invoke } = await import("@tauri-apps/api/core");

        // Clean and sanitize query before calling hq_search
        const sanitized = sanitizeTrackForSearch(title, artist);
        let searchTitle = (sanitized.title || title || "")
          .replace(/\s*\|\s*YouTube(?:\s*Music)?.*$/i, "")
          .replace(/\s*[-–—]\s*YouTube(?:\s*Music)?.*$/i, "")
          .replace(/\s*\|\s*Topic.*$/i, "")
          .replace(/\s*[-–—]\s*Topic.*$/i, "")
          .trim();
        let searchArtist = (sanitized.artist || artist || "").trim();

        // If artist is empty, "YouTube Music", or "Unknown Artist", pass cleaned title without artist to widen search results
        if (!searchArtist || /^(?:youtube(?:\s*music)?|spotify|topic|unknown(?:\s*artist)?)$/i.test(searchArtist)) {
          searchArtist = "";
        }

        // 1. Search for best match
        let track: any = null;
        try {
          track = await invoke("hq_search", { title: searchTitle, artist: searchArtist });
        } catch (searchErr: any) {
          const errStr = typeof searchErr === "string" ? searchErr : JSON.stringify(searchErr);
          // Fallback search if NoMatch (first 3 words of title, stripping artist completely)
          if (errStr.includes("NoMatch") || errStr.includes("No search matches")) {
            const fallback = sanitized.fallbackTitle;
            if (fallback && (fallback !== searchTitle || searchArtist)) {
              try {
                track = await invoke("hq_search", { title: fallback, artist: "" });
              } catch (fallbackErr) {
                console.warn(`Fallback HQ search failed for '${fallback}':`, fallbackErr);
              }
            }
          }
        }

        // Additional fallback attempt if track was not found
        if (!track || !track.id) {
          const fallback = sanitized.fallbackTitle;
          if (fallback && (fallback !== searchTitle || searchArtist)) {
            try {
              track = await invoke("hq_search", { title: fallback, artist: "" });
            } catch (fallbackErr) {
              console.warn(`Fallback HQ search failed for '${fallback}':`, fallbackErr);
            }
          }
        }

        if (activeRequestIdRef.current !== reqId) {
          console.log(`[HQ Playback] Search cancelled for  (stale request).`);
          return;
        }

        if (!track || !track.id) {
          // Silently fall back to YouTube Music without intrusive center toast
          return;
        }

        const requestedQuality = qualityOptionToEnum(settings.hqQuality || "High (320k)");

        // 2. Resolve stream URL
        let streamResult: any;
        try {
          streamResult = await invoke("hq_resolve", {
            source: track.source,
            trackId: track.id,
            title: searchTitle,
            artist: searchArtist,
            quality: requestedQuality,
          });
        } catch (resErr: any) {
          // Check for QualityDowngraded error shape
          if (resErr?.type === "QualityDowngraded" && resErr?.details?.stream) {
            const down = resErr.details;
            streamResult = down.stream;
            setPlaybackState((prev) => ({
              ...prev,
              downgradeNotice: `Fell back to ${down.resolved}`,
            }));
            if (onToast) onToast(`HQ audio: fell back to ${down.resolved}`);
          } else {
            console.warn("HQ Stream resolve error:", resErr);
            return;
          }
        }

        if (activeRequestIdRef.current !== reqId) {
          console.log(`[HQ Playback] Stream resolution discarded for  (stale request).`);
          return;
        }

        if (streamResult?.url && audioRef.current) {
          const audio = audioRef.current;
          if (!audioContextRef.current) {
            initAudioGraph(audio);
          }
          audio.src = streamResult.url;
          audio.crossOrigin = "anonymous";

          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }

          // Immediately pause YouTube Music/Zen in the browser to stop streaming
          if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
            sendLocalMediaCommand("pause", settings.preferredMediaPlayer).catch(() => {});
          }

          audio.play().then(() => {
            isHqActiveState = true;
            skipFailuresRef.current = 0;
            // Reinforce browser pause as soon as native audio playback begins
            if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
              sendLocalMediaCommand("pause", settings.preferredMediaPlayer).catch(() => {});
            }
          }).catch((playErr) => {
            console.warn("HQ audio play prevented or interrupted:", playErr);
          });

          lastResolveTimeRef.current = Date.now();
          currentTtlMsRef.current = (streamResult.ttl_seconds || 1200) * 1000;
          currentTitleRef.current = searchTitle;
          currentArtistRef.current = searchArtist;

          const sourceTag = streamResult.quality === "unknown"
            ? `via ${streamResult.source.toUpperCase()} · server-decided`
            : `via ${streamResult.source.toUpperCase()} · ${streamResult.quality}`;

          setPlaybackState((prev) => ({
            ...prev,
            isActive: true,
            isPlaying: true,
            track: {
              ...track,
              title: streamResult.title || track.title,
              artist: streamResult.artist || track.artist,
            },
            resolvedQuality: streamResult.quality,
            resolvedSource: streamResult.source,
            sourceLabel: sourceTag,
            error: null,
          }));
        }
      } catch (err: any) {
        console.warn("HQ Playback encountered non-blocking error:", err);
        skipFailuresRef.current += 1;
        if (skipFailuresRef.current > 3) {
          isHqActiveState = false;
          setPlaybackState((prev) => ({ ...prev, isActive: false, isPlaying: false, error: "HQ Audio failed 3 times. Falling back to browser." }));
          if (onToast) onToast("HQ Audio failed 3 times. Falling back to browser.");
          if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
            sendLocalMediaCommand("play").catch(() => {});
          }
        }
      }
    },
    [settings.hqAudioEnabled, settings.hqQuality, settings.preferredMediaPlayer, onToast, initAudioGraph]
  );

  // React to track changes when HQ audio is enabled
  useEffect(() => {
    if (audioRef.current) {
      activeHqAudioElement = audioRef.current;
    }
    if (!settings.hqAudioEnabled) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      isHqActiveState = false;
      setPlaybackState((prev) => ({ ...prev, isActive: false, isPlaying: false }));
      return;
    }

    if (currentSongTitle) {
      const nextReqId = ++activeRequestIdRef.current;
      // Immediately pause old audio element so previous track does not bleed through
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      isHqActiveState = false;
      resolveAndPlayHq(currentSongTitle, currentSongArtist || "", nextReqId);
    }
  }, [settings.hqAudioEnabled, currentSongTitle, currentSongArtist, resolveAndPlayHq]);

  const toggleHqPlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      if (!audioContextRef.current) {
        initAudioGraph(audioRef.current);
      }
      // Re-resolve before play() if elapsed time exceeded 80% of TTL to prevent silent 404 on expired CDN URLs
      const now = Date.now();
      const elapsed = now - lastResolveTimeRef.current;
      if (elapsed > currentTtlMsRef.current * 0.8 && currentTitleRef.current) {
        await resolveAndPlayHq(currentTitleRef.current, currentArtistRef.current);
        return;
      }

      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      audioRef.current.play().then(() => {
        isHqActiveState = true;
        setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
        // On Play in Nocturne, ensure browser is paused and only native <audio> plays
        if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
          sendLocalMediaCommand("pause", settings.preferredMediaPlayer).catch(() => {});
        }
      }).catch((e) => console.warn("HQ play error:", e));
    } else {
      audioRef.current.pause();
      isHqActiveState = false;
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      // On Pause in Nocturne, send playerctl pause to the browser
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        sendLocalMediaCommand("pause", settings.preferredMediaPlayer).catch(() => {});
      }
    }
  }, [resolveAndPlayHq, initAudioGraph, settings.preferredMediaPlayer]);

  return {
    audioRef,
    playbackState,
    initAudioGraph,
    toggleHqPlayPause,
    resolvedQuality: playbackState.resolvedQuality,
    isHqActive: playbackState.isActive,
  };
}
