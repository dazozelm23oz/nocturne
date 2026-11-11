/* eslint-disable @next/next/no-img-element */
import styles from "@/styles/AppleMusic.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  useSong,
  useSpotify,
  useTime,
  useRefetchSong,
  useOptimisticPlayback,
} from "@/providers/SongContext";
import Signin from "@/components/Signin";
import NotPlaying from "@/components/NotPlaying";
import { useKaroke, useLyrics } from "@/providers/LyricsContext";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { tokenizeLyric, TokenizedLyricLine } from "@/lib/lyricTokenizer";
import { usePremium } from "@/providers/UserContext";
import AppleMusicSettingsModal from "@/components/AppleMusicSettingsModal";
import {
  LyricsSettings,
  DEFAULT_LYRICS_SETTINGS,
} from "@/typings/LyricsSettings";
import { extractPalette, PaletteColors } from "@/lib/paletteExtractor";
import { useHqPlayback } from "@/lib/useHqPlayback";
import AudioSpectrumVisualizer from "@/components/AudioSpectrumVisualizer";
import VinylTurntable from "@/components/VinylTurntable";
import AuroraMeshOrbs from "@/components/AuroraMeshOrbs";
import InstrumentalBreak from "@/components/InstrumentalBreak";
import AmbientStardust from "@/components/AmbientStardust";
import RiffWavyProgressBar from "@/components/RiffWavyProgressBar";
import GruvboxIcon from "@/components/icons/GruvboxIcon";
import { recordMetric } from "@/lib/performanceMetrics";
import { ALL_LYRIC_SOURCES, LyricSourceId } from "@/lib/lyricsSources";

function getLuminanceFromHex(hexOrRgb: string): number {
  if (!hexOrRgb) return 0.5;
  if (hexOrRgb.startsWith("#")) {
    let hex = hexOrRgb.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = (parseInt(hex.substring(0, 2), 16) || 0) / 255;
    const g = (parseInt(hex.substring(2, 4), 16) || 0) / 255;
    const b = (parseInt(hex.substring(4, 6), 16) || 0) / 255;
    const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
  }
  return 0.5;
}

function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function formatRemaining(durationMs: number, currentSec: number): string {
  const totalSec = durationMs / 1000;
  const remainingSec = Math.max(0, totalSec - currentSec);
  return `-${formatTime(remainingSec)}`;
}

interface LyricLineProps {
  line: { seconds: number; lyrics: string };
  index: number;
  isActive: boolean;
  nextSeconds: number;
  currentTime: number;
  isPlaying: boolean;
  settings: LyricsSettings;
  onSeek: (sec: number) => void;
}

const KaraokeLine = memo(function KaraokeLine({
  line,
  index,
  isActive,
  nextSeconds,
  currentTime,
  isPlaying,
  settings,
  onSeek,
}: LyricLineProps) {
  const lineRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement>(null);
  const syncRef = useRef({
    baseTime: currentTime,
    timestamp: typeof performance !== "undefined" ? performance.now() : Date.now(),
  });

  const tokenized = useMemo(() => tokenizeLyric(line.lyrics || ""), [line.lyrics]);

  useEffect(() => {
    syncRef.current = {
      baseTime: currentTime,
      timestamp: typeof performance !== "undefined" ? performance.now() : Date.now(),
    };
  }, [currentTime]);

  const isCJK = tokenized.isCJK;
  const allowKaraoke =
    settings.karaokeMode && !(isCJK && settings.disableCJKKaraoke);
  const allowWordShine =
    isActive && (isCJK ? settings.cjkWordShine : settings.wordShine);

  useEffect(() => {
    if (!isActive || !allowKaraoke) {
      if (lineRef.current) {
        if (!allowKaraoke && isActive) {
          lineRef.current.style.setProperty("--karaoke-pct", "100%");
          // Regular line-by-line: entire line is illuminated at once
          for (let wIdx = 0; wIdx < tokenized.wordTokens.length; wIdx++) {
            const el = wordRefs.current[wIdx];
            if (el) {
              el.dataset.status = "done";
              el.className = `${styles.karaokeWord} ${styles.wordCompleted} ${
                tokenized.wordTokens[wIdx]?.isBacking ? styles.backingWord : ""
              }`;
              el.style.removeProperty("--word-pct");
            }
          }
        } else {
          lineRef.current.style.removeProperty("--karaoke-pct");
          // Reset all words to pending inactive
          for (let wIdx = 0; wIdx < tokenized.wordTokens.length; wIdx++) {
            const el = wordRefs.current[wIdx];
            if (el) {
              el.dataset.status = "pending";
              el.className = `${styles.karaokeWord} ${styles.wordUnplayed} ${
                tokenized.wordTokens[wIdx]?.isBacking ? styles.backingWord : ""
              }`;
              el.style.removeProperty("--word-pct");
            }
          }
        }
      }
      return;
    }

    let animId: number;
    const lineStart = line.seconds;
    const speedMultiplier =
      settings.lyricSpeed === "Fast (1.2x)"
        ? 1.2
        : settings.lyricSpeed === "Relaxed (0.8x)"
        ? 0.8
        : 1.0;
    const lineDuration = Math.max(0.4, (nextSeconds - lineStart) / speedMultiplier);

    const update = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const interpolatedTime = isPlaying
        ? syncRef.current.baseTime + (now - syncRef.current.timestamp) / 1000
        : currentTime;

      const elapsed = Math.max(0, interpolatedTime - lineStart);
      const rawPct = Math.min(100, Math.max(0, (elapsed / lineDuration) * 100));

      let easedPct = rawPct;
      if (settings.lyricEasing === "Cubic-Bezier (Smooth)") {
        const t = rawPct / 100;
        easedPct = Math.min(1, Math.max(0, 1 - Math.pow(1 - t, 2.2))) * 100;
      } else if (settings.lyricEasing === "Ease-In-Out") {
        const t = rawPct / 100;
        easedPct = (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * 100;
      } else if (settings.lyricEasing === "Expressive Spring") {
        const t = rawPct / 100;
        easedPct = Math.min(1, Math.max(0, Math.sin(t * Math.PI * 0.5) * 1.02)) * 100;
      }

      const P = Math.min(1, Math.max(0, easedPct / 100));

      // Sequential word highlight: Line 1 sweeps first, then Line 2, then Line 3
      let activeWordEl: HTMLSpanElement | null = null;
      let activeWordLocalPct = 0;

      const magnifyActive = Boolean(settings.syllableMagnify);

      for (let wIdx = 0; wIdx < tokenized.wordTokens.length; wIdx++) {
        const w = tokenized.wordTokens[wIdx];
        const el = wordRefs.current[wIdx];
        if (!el) continue;

        const isLastWordInLine = wIdx === tokenized.wordTokens.length - 1;
        // Last word / terminal syllable gets a slightly more pronounced, dramatic magnify bloom
        const magnifyScale = isLastWordInLine ? "1.20" : "1.14";

        if (P >= w.endFrac) {
          if (el.dataset.status !== "done") {
            el.dataset.status = "done";
            el.className = `${styles.karaokeWord} ${styles.wordCompleted} ${
              w.isBacking ? styles.backingWord : ""
            } ${magnifyActive ? styles.wordMagnified : ""}`;
            el.style.removeProperty("--word-pct");
            el.style.removeProperty("--word-magnify-scale");
          }
        } else if (P <= w.startFrac) {
          if (el.dataset.status !== "pending") {
            el.dataset.status = "pending";
            el.className = `${styles.karaokeWord} ${styles.wordUnplayed} ${
              w.isBacking ? styles.backingWord : ""
            }`;
            el.style.removeProperty("--word-pct");
            el.style.removeProperty("--word-magnify-scale");
          }
        } else {
          // Word currently active: calculate smooth local percentage within this specific word
          const denom = Math.max(0.001, w.endFrac - w.startFrac);
          const localPct = Math.min(100, Math.max(0, ((P - w.startFrac) / denom) * 100));
          if (el.dataset.status !== "active") {
            el.dataset.status = "active";
            el.className = `${styles.karaokeWord} ${styles.wordActive} ${
              w.isBacking ? styles.backingWord : ""
            } ${magnifyActive ? styles.wordMagnified : ""}`;
            if (magnifyActive) {
              el.style.setProperty("--word-magnify-scale", magnifyScale);
            }
          }
          el.style.setProperty("--word-pct", `${localPct.toFixed(1)}%`);

          if (!activeWordEl) {
            activeWordEl = el;
            activeWordLocalPct = localPct;
          }
        }
      }

      // Dynamic Bouncing Indicator: follows active word down through wrapped lines
      if (dotRef.current) {
        const targetEl = activeWordEl || (tokenized.wordTokens.length > 0 ? wordRefs.current[0] : null);
        if (targetEl) {
          const wordLeft = targetEl.offsetLeft;
          const wordTop = targetEl.offsetTop;
          const wordWidth = targetEl.offsetWidth;
          const dotX = wordLeft + (wordWidth * (activeWordLocalPct / 100)) - 7;
          const dotY = wordTop - 12;
          dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
          dotRef.current.style.opacity = "1";
        } else {
          dotRef.current.style.opacity = "0";
        }
      }

      if (rawPct < 100 && isPlaying) {
        animId = requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    isActive,
    line.seconds,
    nextSeconds,
    currentTime,
    isPlaying,
    allowKaraoke,
    settings.lyricSpeed,
    settings.lyricEasing,
    tokenized,
  ]);

  // Determine animation classes
  let animClass = "";
  if (isActive && settings.additionalAnimations) {
    if (settings.lyricMovement === "Apple TV Kinetic (Default)") {
      animClass = styles.movementKinetic;
    } else if (settings.lyricMovement === "Cinematic Center Snap") {
      animClass = styles.movementCinematic;
    } else if (settings.lyricMovement === "Floating Wave Drift") {
      animClass = styles.movementWaveDrift;
    } else if (settings.lyricMovement === "Elastic Spring Pop") {
      animClass = styles.movementElasticPop;
    } else if (settings.lyricMovement === "Smooth Fade & Glide") {
      animClass = styles.movementSmoothGlide;
    } else if (settings.lyricMovement === "Subtle Classic") {
      animClass = styles.movementClassic;
    } else if (settings.floatAnimation === "High (Default)") {
      animClass = styles.floatHigh;
    } else if (settings.floatAnimation === "Medium") {
      animClass = styles.floatMedium;
    } else if (settings.floatAnimation === "Low") {
      animClass = styles.floatLow;
    }
  }

  const isRainbow = settings.lyricGradient === "Rainbow Spectrum (Animated)";
  const isMultiGradient = (
    settings.lyricGradient === "Album Vibrant Multi-Hue" ||
    settings.lyricGradient === "Album Warm Harmony" ||
    settings.lyricGradient === "Album Deep Contrast"
  );
  const rainbowClass = isRainbow && isActive ? styles.rainbowLyricLine : (isMultiGradient && isActive ? styles.gradientLyricLine : "");

  // Dynamic line scaling for Riff auto-fit typography
  let scaleClass = "";
  if (settings.dynamicLineScaling) {
    const lineLen = (line.lyrics || "").trim().length;
    if (lineLen > 0 && lineLen <= 18) {
      scaleClass = styles.lineShortScale;
    } else if (lineLen >= 55) {
      scaleClass = styles.lineCompactScale;
    }
  }

  const isDuet =
    settings.duetView &&
    line.lyrics &&
    line.lyrics.trim().startsWith("(") &&
    line.lyrics.trim().endsWith(")");

  const showVocalistBadge = settings.vocalistBadges && settings.duetView;

  return (
    <p
      ref={lineRef}
      id={`lyric-line-${index}`}
      data-seconds={line.seconds}
      onClick={() => onSeek(line.seconds)}
      className={`${styles.lyricLine} ${
        isActive ? styles.active : styles.inactive
      } ${animClass} ${scaleClass} ${rainbowClass} ${
        allowWordShine ? styles.wordShining : ""
      } ${
        isActive && settings.particleSparkle ? styles.particleSparkleActive : ""
      } ${isDuet ? styles.duetRight : ""}`}
    >
      {isActive && settings.karaokeBouncingBall && allowKaraoke && isPlaying && (
        <span ref={dotRef} className={styles.karaokeBouncingDot}>
          <span className={styles.karaokeBouncingDotInner} />
        </span>
      )}
      {showVocalistBadge && isDuet && (
        <span className={styles.duetBadgeBacking}>Singer 2</span>
      )}
      {showVocalistBadge && !isDuet && index % 4 === 0 && (
        <span className={styles.duetBadgeLead}>Singer 1</span>
      )}
      {tokenized.tokens.length === 0 ? (
        parseLyrics(line.lyrics)
      ) : (
        tokenized.tokens.map((token, tIdx) => {
          if (token.isNewline) {
            return <br key={tIdx} />;
          }
          if (token.isSpace) {
            return (
              <span key={tIdx} className={styles.karaokeSpace}>
                {token.text}
              </span>
            );
          }
          if (token.text === "(" || token.text === ")") {
            return (
              <span key={tIdx} className={styles.backingParen}>
                {token.text}
              </span>
            );
          }
          const wIdx = tokenized.wordTokens.indexOf(token);
          const initialClass = !isActive
            ? styles.wordUnplayed
            : !allowKaraoke
            ? styles.wordCompleted
            : styles.wordUnplayed;

          return (
            <span
              key={tIdx}
              ref={(el) => {
                if (wIdx >= 0) wordRefs.current[wIdx] = el;
              }}
              data-status={!isActive ? "pending" : !allowKaraoke ? "done" : "pending"}
              className={`${styles.karaokeWord} ${initialClass} ${
                token.isBacking ? styles.backingWord : ""
              }`}
            >
              {token.text}
            </span>
          );
        })
      )}
    </p>
  );
});

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const song = useSong();
  const karoke = useKaroke();
  const data = useSpotify();
  const [settings, setSettings] = useState<LyricsSettings>(DEFAULT_LYRICS_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const rawCurrentTime = useTime();
  const { audioRef, playbackState: hqPlayback, initAudioGraph, resolvedQuality, isHqActive } = useHqPlayback(
    settings,
    song?.name,
    song?.artist,
    setToastMessage
  );
  const syncOffsetSec = (settings.syncOffsetMs || 0) / 1000;
  const currentTime = Math.max(0, rawCurrentTime + syncOffsetSec);

  const qualityBadgeLabel = useMemo(() => {
    if (isHqActive) {
      if (hqPlayback?.resolvedSource === "python") {
        return "YT Native";
      }
      const q = (resolvedQuality || "").toLowerCase();
      if (q.includes("24bit") || q.includes("hires")) return "Hi-Res FLAC";
      if (q.includes("flac") || q.includes("lossless")) return "FLAC";
      if (q.includes("320") || q.includes("high")) return "320k";
      if (q.includes("128") || q.includes("standard")) return "128k";
      return resolvedQuality?.toUpperCase() || "FLAC";
    }
    return "YouTube Music";
  }, [isHqActive, resolvedQuality, hqPlayback?.resolvedSource]);
  const lyric = useLyrics();
  const premium = usePremium();
  const refetchSong = useRefetchSong();
  const { skipNext, skipPrev, seekTo, togglePlayPause } = useOptimisticPlayback();

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [needsReauth, setNeedsReauth] = useState<boolean>(false);

  // Apple Music Lyrics Settings State & Persistence (moved up)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // 3-Dots Popover Menu, Toast & Track Modal States
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [isHoveringScroller, setIsHoveringScroller] = useState<boolean>(false);

  // Hidden Top-Right Quick Provider Switcher state
  const [quickSourceDropdown, setQuickSourceDropdown] = useState<"lyrics" | "karaoke" | null>(null);
  const quickSourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutsideQuick = (e: MouseEvent) => {
      if (quickSourceRef.current && !quickSourceRef.current.contains(e.target as Node)) {
        setQuickSourceDropdown(null);
      }
    };
    if (quickSourceDropdown) {
      document.addEventListener("mousedown", handleClickOutsideQuick);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideQuick);
    };
  }, [quickSourceDropdown]);

  // Apple TV Cinema Mode: Auto-hide controls when mouse is idle
  const [isControlsIdle, setIsControlsIdle] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsControlsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsIdle(true);
    }, 3500);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    resetIdleTimer();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Smooth Scrubber Rewind & Seek State
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [optimisticTime, setOptimisticTime] = useState<number | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSongUriRef = useRef<string | null>(song?.uri || null);
  const prevTimeRef = useRef<number>(currentTime);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Trigger smooth rewind whenever song URI changes (song finishes or external skip)
  useEffect(() => {
    if (song?.uri && lastSongUriRef.current && lastSongUriRef.current !== song.uri) {
      setIsSkipping(true);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => {
        setIsSkipping(false);
      }, 480);
    }
    lastSongUriRef.current = song?.uri || null;
  }, [song?.uri]);

  // Trigger smooth rewind if song repeats from the start
  useEffect(() => {
    if (!isSeeking && optimisticTime === null && prevTimeRef.current > 5 && currentTime < 2) {
      setIsSkipping(true);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => {
        setIsSkipping(false);
      }, 450);
    }
    prevTimeRef.current = currentTime;
  }, [currentTime, isSeeking, optimisticTime]);

  // Load persisted settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apple_music_lyrics_settings");
      if (saved) {
        setSettings((prev) => ({
          ...prev,
          ...JSON.parse(saved),
        }));
      }
    } catch (e) {
      console.warn("Could not load settings from localStorage", e);
    }
  }, []);

  // Update and persist settings
  const handleUpdateSettings = useCallback(
    (updater: (prev: LyricsSettings) => LyricsSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(
            "apple_music_lyrics_settings",
            JSON.stringify(next)
          );
        } catch (e) {
          console.warn("Could not save settings to localStorage", e);
        }
        return next;
      });
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2500);
  }, []);

  const openTargetUrl = useCallback((targetUriOrUrl: string, toastLabel?: string) => {
    if (!targetUriOrUrl) return;
    if (toastLabel) showToast(toastLabel);

    fetch(`/api/system/open?url=${encodeURIComponent(targetUriOrUrl)}`)
      .then((res) => {
        if (!res.ok) {
          if (targetUriOrUrl.startsWith("spotify:")) {
            window.location.href = targetUriOrUrl;
          } else {
            window.open(targetUriOrUrl, "_blank");
          }
        }
      })
      .catch(() => {
        if (targetUriOrUrl.startsWith("spotify:")) {
          window.location.href = targetUriOrUrl;
        } else {
          window.open(targetUriOrUrl, "_blank");
        }
      });
  }, [showToast]);

  async function handleReconnect() {
    await signOut({ redirect: false });
    signIn("spotify");
  }

  // Click outside to close 3-dots menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Check if currently playing song is in user's Liked Songs
  useEffect(() => {
    const trackId =
      song?.id || (song?.uri ? song.uri.replace("spotify:track:", "") : null);

    if (!trackId) {
      setIsLiked(false);
      return;
    }

    let active = true;
    fetch(`/api/spotify/liked?id=${trackId}`)
      .then(async (res) => {
        if (res.status === 403) {
          if (active) setNeedsReauth(true);
          return null;
        }
        if (res.ok) {
          if (active) setNeedsReauth(false);
          return res.json();
        }
        return null;
      })
      .then((d) => {
        if (active && d && typeof d.liked === "boolean") {
          setIsLiked(d.liked);
          setNeedsReauth(false);
        }
      })
      .catch((err) => console.error("Failed to check liked status", err));

    return () => {
      active = false;
    };
  }, [song?.id, song?.uri, session]);

  // Center active lyric smoothly in the viewport
  useEffect(() => {
    if (karoke?.index !== undefined && karoke.index !== null) {
      const activeEl = document.getElementById(`lyric-line-${karoke.index}`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [karoke?.index]);

  // Reset scroll to top when song changes
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [song?.uri]);

  // Update window title
  useEffect(() => {
    if (song?.name) {
      document.title = `Nocturne - ${song.name} • ${song.artist}`;
    } else {
      document.title = "Nocturne";
    }
  }, [song?.name, song?.artist]);

  const seek = useCallback(
    (seconds: number) => {
      seekTo(seconds);
    },
    [seekTo]
  );

  function handleScrubberClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!song?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = (pct * song.duration) / 1000;

    setIsSeeking(true);
    setOptimisticTime(targetSeconds);
    const seekStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    seekTo(targetSeconds);
    recordMetric("seek_action", (typeof performance !== "undefined" ? performance.now() : Date.now()) - seekStart);

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setIsSeeking(false);
      setOptimisticTime(null);
    }, 450);
  }

  function playback(pause: boolean) {
    // 0ms INSTANT OPTIMISTIC PLAY/PAUSE UI TOGGLE
    togglePlayPause(pause);

    const pbStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    fetch("/api/spotify/playback", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pause ? { pause: true } : { play: true }),
    }).finally(() => {
      const pbElapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - pbStart;
      recordMetric("playback_toggle", pbElapsed);
    });

    // Schedule rapid refresh
    setTimeout(() => {
      refetchSong(true);
    }, 250);
  }

  async function nextTrack(e: React.MouseEvent) {
    e.stopPropagation();
    setIsSkipping(true);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => {
      setIsSkipping(false);
    }, 450);

    // 0ms INSTANT OPTIMISTIC SKIP (Queue-backed)
    const skipStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    await skipNext();
    recordMetric("skip_speed", (typeof performance !== "undefined" ? performance.now() : Date.now()) - skipStart);
  }

  async function previousTrack(e: React.MouseEvent) {
    e.stopPropagation();
    setIsSkipping(true);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => {
      setIsSkipping(false);
    }, 450);

    // 0ms INSTANT OPTIMISTIC PREV (History-backed / rewind)
    const prevStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    await skipPrev(currentTime);
    recordMetric("skip_speed", (typeof performance !== "undefined" ? performance.now() : Date.now()) - prevStart);
  }

  function togglePlayback(e: React.MouseEvent) {
    e.stopPropagation();
    playback(data?.is_playing || false);
  }

  async function toggleShuffle(e: React.MouseEvent) {
    e.stopPropagation();
    const nextShuffle = !data?.shuffle_state;
    try {
      await fetch("/api/spotify/playback", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shuffle: nextShuffle }),
      });
    } finally {
      refetchSong(true);
    }
  }

  async function toggleRepeat(e: React.MouseEvent) {
    e.stopPropagation();
    const currentRepeat = data?.repeat_state || "off";
    let nextRepeat = "context";
    if (currentRepeat === "context") nextRepeat = "track";
    else if (currentRepeat === "track") nextRepeat = "off";
    else nextRepeat = "context";

    try {
      await fetch("/api/spotify/playback", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repeat: nextRepeat }),
      });
    } finally {
      refetchSong(true);
    }
  }

  async function toggleLiked(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const trackId =
      song?.id || (song?.uri ? song.uri.replace("spotify:track:", "") : null);

    if (!trackId || isLiking) return;

    if (needsReauth) {
      handleReconnect();
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked); // Optimistic UI update
    setIsLiking(true);

    try {
      let res: Response;
      if (nextLiked) {
        res = await fetch("/api/spotify/liked", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: trackId }),
        });
      } else {
        res = await fetch(`/api/spotify/liked?id=${trackId}`, {
          method: "DELETE",
        });
      }

      if (!res.ok) {
        if (res.status === 403) {
          setNeedsReauth(true);
        }
        setIsLiked(!nextLiked); // Revert on failure
      } else {
        setNeedsReauth(false);
      }
    } catch (err) {
      console.error("Failed to update liked status", err);
      setIsLiked(!nextLiked); // Revert on error
    } finally {
      setIsLiking(false);
    }
  }

  // Prevent sleep using Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    if (settings.preventSleep && "wakeLock" in navigator) {
      (navigator as any).wakeLock
        .request("screen")
        .then((lock: any) => {
          wakeLock = lock;
        })
        .catch((err: any) => console.log("WakeLock error", err));
    }
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [settings.preventSleep]);

  // FPS Counter calculation for FPS overlay
  const [fps, setFps] = useState<number>(60);
  useEffect(() => {
    if (!settings.fpsOverlay) return;
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [settings.fpsOverlay]);

  // Extract Dominant Palette based on user's selected algorithm
  const [paletteColors, setPaletteColors] = useState<PaletteColors | null>(null);
  useEffect(() => {
    if (song?.image) {
      extractPalette(song.image, settings.paletteAlgorithm)
        .then(setPaletteColors)
        .catch((err) => console.warn("Failed to extract palette", err));
    }
  }, [song?.image, settings.paletteAlgorithm]);

  // Zooming Restore State & Persistence
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  useEffect(() => {
    if (settings.zoomingRestore) {
      try {
        const savedZoom = localStorage.getItem("apple_music_lyrics_zoom");
        if (savedZoom) {
          const parsed = parseFloat(savedZoom);
          if (!isNaN(parsed) && parsed >= 0.6 && parsed <= 1.8) {
            setZoomScale(parsed);
          }
        }
      } catch (e) {}
    } else {
      setZoomScale(1.0);
    }
  }, [settings.zoomingRestore]);

  // Pulling effect physics state
  const [pullOffset, setPullOffset] = useState<number>(0);
  const [isPullBouncing, setIsPullBouncing] = useState<boolean>(false);
  const pullBounceTimer = useRef<NodeJS.Timeout | null>(null);

  const pullMultiplier =
    settings.pullingEffect === "Disabled"
      ? 0
      : settings.pullingEffect === "Low"
      ? 0.18
      : settings.pullingEffect === "Regular"
      ? 0.38
      : settings.pullingEffect === "Medium (Default)"
      ? 0.58
      : settings.pullingEffect === "High"
      ? 0.95
      : 1.5;

  const handleLyricsWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // Zooming with Ctrl + Wheel
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setZoomScale((prev) => {
          const next = Math.max(0.65, Math.min(1.7, +(prev + delta).toFixed(2)));
          if (settings.zoomingRestore) {
            try {
              localStorage.setItem("apple_music_lyrics_zoom", next.toString());
            } catch (err) {}
          }
          return next;
        });
        return;
      }

      // Pulling effect overscroll physics
      if (pullMultiplier > 0 && scrollerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
        const atTop = scrollTop <= 0 && e.deltaY < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 2 && e.deltaY > 0;

        if (atTop || atBottom) {
          setIsPullBouncing(false);
          setPullOffset((cur) => {
            const pullChange = -e.deltaY * pullMultiplier * 0.15;
            return Math.max(-120, Math.min(120, cur + pullChange));
          });

          if (pullBounceTimer.current) clearTimeout(pullBounceTimer.current);
          pullBounceTimer.current = setTimeout(() => {
            setIsPullBouncing(true);
            setPullOffset(0);
            setTimeout(() => setIsPullBouncing(false), 420);
          }, 120);
        }
      }
    },
    [pullMultiplier, settings.zoomingRestore]
  );

  // Derive styles from Settings
  const blurPx = !settings.blurLyrics
    ? 0
    : settings.blurLevel === 1
    ? 2.5
    : settings.blurLevel === 2
    ? 4
    : settings.blurLevel === 3
    ? 6
    : settings.blurLevel === 4
    ? 8
    : 11;

  let fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    fontStack = '"Playfair Display", "Newsreader", "New York", Georgia, serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    fontStack = '"Plus Jakarta Sans", "CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    fontStack = '"Montserrat", "SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    fontStack = '"Nunito", "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    fontStack = '"JetBrains Mono", Consolas, Monaco, monospace';
  }

  // Style Preset Mapping
  let stylePresetClass = styles.style_iOS26;
  switch (settings.stylePreset) {
    case "iOS 26.4 and later":
      stylePresetClass = styles.style_iOS26Later;
      break;
    case "iOS 26.0":
      stylePresetClass = styles.style_iOS26;
      break;
    case "iOS 17.1":
      stylePresetClass = styles.style_iOS17;
      break;
    case "iOS 16.4":
    case "iOS 16.3":
    case "iOS 16.2":
      stylePresetClass = styles.style_iOS16;
      break;
    case "iOS 15":
      stylePresetClass = styles.style_iOS15;
      break;
    case "Android (New)":
      stylePresetClass = styles.style_AndroidNew;
      break;
    case "Android (Old)":
      stylePresetClass = styles.style_AndroidOld;
      break;
    case "Custom":
      stylePresetClass = styles.style_Custom;
      break;
  }

  let bgClass = "";
  if (settings.background === "Dynamic") bgClass = styles.ambientDynamic;
  else if (settings.background === "Dynamic (Beating)") bgClass = styles.ambientBeating;
  else if (settings.background === "Apple Music") bgClass = styles.ambientAppleMusic;
  else if (settings.background === "Isolation (Beta)") bgClass = styles.ambientIsolation;
  else if (settings.background === "Static") bgClass = styles.ambientStatic;

  // Theme Computation: Light Mode, Dark Mode, or Palette-Adaptive Auto Theme
  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";
  // Strict luminance check: if background luminance > 0.5, force light mode (dark text #111).
  // If < 0.5, force dark mode (light text #fff).
  const autoBgLum = paletteColors?.primary ? getLuminanceFromHex(paletteColors.primary) : (paletteColors?.isLight ? 0.65 : 0.2);
  const isLightMode = settings.theme === "Light" || (settings.theme === "Auto (Album Art)" && autoBgLum > 0.5);

  const themeClass = isLightMode ? styles.themeLight : styles.themeDark;

  // Dynamic High-Contrast Filled Star Calculation based on Background Luminosity
  const isBackgroundLight = isLightMode;
  const starContrast = isBackgroundLight
    ? {
        fill: "#b45309", // Deep high-contrast amber gold (WCAG AA certified contrast on light backgrounds)
        stroke: "#78350f",
        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))",
        btnBg: "rgba(180, 83, 9, 0.12)",
        btnBorder: "1px solid rgba(180, 83, 9, 0.35)",
        btnShadow: "0 2px 8px rgba(180, 83, 9, 0.2)",
      }
    : {
        fill: "#fbbf24", // Radiant luminous star gold (>10:1 contrast ratio on dark backgrounds)
        stroke: "#f59e0b",
        filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.65))",
        btnBg: "rgba(245, 158, 11, 0.18)",
        btnBorder: "1px solid rgba(251, 191, 36, 0.45)",
        btnShadow: "0 0 16px rgba(245, 158, 11, 0.35)",
      };

  const songKey = song?.uri || (song?.name && song?.artist ? `${song.name}-${song.artist}` : "");
  const pinnedColor = songKey && settings.pinnedSongColors ? settings.pinnedSongColors[songKey] : null;

  let effectiveGradient = pinnedColor || settings.lyricGradient || "Album Accent Gradient";
  if (settings.lyricColorScope === "Per-Song Adaptive" && !pinnedColor && settings.lyricGradient === "Album Accent Gradient") {
    effectiveGradient = "Album Accent Gradient";
  }

  const isBgLight = isLightMode;
  const hardcodedContrastText = isBgLight ? "#111113" : "#ffffff";
  let lyricGradientColor = paletteColors?.primary || hardcodedContrastText;

  // Strict WCAG contrast check: if contrast with background is insufficient, force #111 or #fff
  if (paletteColors?.primary) {
    const primaryLum = getLuminanceFromHex(paletteColors.primary);
    if (isBgLight && primaryLum > 0.4) {
      lyricGradientColor = "#111113";
    } else if (!isBgLight && primaryLum < 0.25) {
      lyricGradientColor = "#ffffff";
    }
  }
  if (effectiveGradient === "Rainbow Spectrum (Animated)") {
    lyricGradientColor = "#ff2a5f";
  } else if (effectiveGradient === "White Pure Glow") {
    lyricGradientColor = isLightMode ? "#111113" : "#ffffff";
  } else if (effectiveGradient === "Espresso Amber & Gold") {
    lyricGradientColor = "#f59e0b";
  } else if (effectiveGradient === "Sunset Coral & Peach") {
    lyricGradientColor = "#ff6b6b";
  } else if (effectiveGradient === "Vibrant Neon") {
    lyricGradientColor = "#00f2fe";
  } else if (effectiveGradient === "Emerald Aurora") {
    lyricGradientColor = "#10b981";
  } else if (effectiveGradient === "Royal Amethyst") {
    lyricGradientColor = "#a855f7";
  } else if (effectiveGradient === "Rose Quartz") {
    lyricGradientColor = "#fb7185";
  } else if (effectiveGradient === "Custom Color") {
    lyricGradientColor = settings.customLyricColor || "#f59e0b";
  } else if (effectiveGradient === "Album Accent Gradient" && paletteColors?.primary) {
    lyricGradientColor = paletteColors.primary;
  } else if (effectiveGradient === "Album Vibrant Multi-Hue" && paletteColors) {
    const p1 = paletteColors.primary;
    const p2 = paletteColors.secondary;
    const p3 = paletteColors.tertiary || p1;
    lyricGradientColor = `linear-gradient(90deg, ${p1} 0%, ${p2} 50%, ${p3} 100%)`;
  } else if (effectiveGradient === "Album Warm Harmony" && paletteColors) {
    const p1 = paletteColors.primary;
    const p2 = paletteColors.tertiary || paletteColors.secondary;
    lyricGradientColor = `linear-gradient(90deg, ${p1} 0%, ${p2} 100%)`;
  } else if (effectiveGradient === "Album Deep Contrast" && paletteColors) {
    const p1 = paletteColors.primary;
    const p4 = paletteColors.quaternary || paletteColors.secondary;
    lyricGradientColor = `linear-gradient(90deg, ${p1} 0%, ${p4} 100%)`;
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34c759"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FPS Overlay Pill (matches Apple Music Lyrics FPS counter) */}
      {settings.fpsOverlay && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            left: "18px",
            background: "rgba(30, 30, 32, 0.7)",
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: "13px",
            fontWeight: "700",
            padding: "4px 8px",
            borderRadius: "6px",
            zIndex: 99999,
            backdropFilter: "blur(12px)",
            fontFamily: "-apple-system, monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1.15,
            pointerEvents: "none",
            userSelect: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontSize: "8px", opacity: 0.55, letterSpacing: "0.05em" }}>FPS</span>
          <span>{fps}</span>
        </div>
      )}

      {/* Hidden Top-Right Quick Provider Switcher & Audio Quality Badge (Invisible unless hovered) */}
      {song && song.name && (
        <div className={styles.quickSourceHotspot} ref={quickSourceRef}>
          <div
            className={`${styles.quickSourceContainer} ${
              quickSourceDropdown ? styles.activeOpen : ""
            }`}
          >
            {/* Subtle Audio Quality Hover Badge (next to Lyrics/Karaoke buttons) */}
<div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 9999,
    background: isHqActive
      ? (hqPlayback?.resolvedSource === "python" ? "rgba(59, 130, 246, 0.22)" : "rgba(29, 185, 84, 0.22)")
      : "rgba(255, 255, 255, 0.12)",
    border: `1px solid ${
      isHqActive
        ? (hqPlayback?.resolvedSource === "python" ? "rgba(59, 130, 246, 0.45)" : "rgba(29, 185, 84, 0.45)")
        : "rgba(255, 255, 255, 0.18)"
    }`,
    color: isHqActive
      ? (hqPlayback?.resolvedSource === "python" ? "#60a5fa" : "#1ed760")
      : "rgba(255, 255, 255, 0.85)",
    fontSize: 11.5,
    fontWeight: 650,
    letterSpacing: "0.03em",
    userSelect: "none",
  }}
>
  <span
    style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: isHqActive 
        ? (hqPlayback?.resolvedSource === "python" ? "#3b82f6" : "#1ed760") 
        : "#ff0033",
      boxShadow: isHqActive 
        ? (hqPlayback?.resolvedSource === "python" ? "0 0 8px #3b82f6" : "0 0 8px #1ed760") 
        : "0 0 6px #ff0033",
    }}
  />
  <span>{isHqActive ? qualityBadgeLabel : "YouTube Music"}</span>
</div>

            {/* Button 1: Lyric Provider for this song only */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={`${styles.quickSourceBtn} ${
                  quickSourceDropdown === "lyrics" ? styles.quickSourceBtnActive : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickSourceDropdown((prev) => (prev === "lyrics" ? null : "lyrics"));
                }}
                title="Change Lyric Provider (This Song Only)"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Lyrics:</span>
                <span className={styles.quickSourceBtnTag}>
                  {(lyric as any)?.source?.toUpperCase() || "AUTO"}
                </span>
              </button>

              {quickSourceDropdown === "lyrics" && (
                <div
                  className={styles.quickSourceDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.quickSourceDropdownHeader}>
                    <span>Lyrics Source (This Song)</span>
                  </div>
                  {ALL_LYRIC_SOURCES.filter((s) => s.supportsLineSync).map((src) => {
                    const isCurrent = (lyric as any)?.source === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        className={`${styles.quickSourceDropdownItem} ${
                          isCurrent ? styles.quickSourceDropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new CustomEvent("song_source_override", {
                                detail: { source: src.id, preferKaraoke: false },
                              })
                            );
                          }
                          setQuickSourceDropdown(null);
                          setToastMessage(`Source changed to ${src.name} (This song)`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                      >
                        <span>{src.name}</span>
                        {isCurrent && <span style={{ fontSize: "11px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Button 2: Karaoke Provider for this song only */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={`${styles.quickSourceBtn} ${
                  quickSourceDropdown === "karaoke" ? styles.quickSourceBtnActive : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickSourceDropdown((prev) => (prev === "karaoke" ? null : "karaoke"));
                }}
                title="Change Karaoke Provider (This Song Only)"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Karaoke:</span>
                <span className={styles.quickSourceBtnTag}>
                  {(lyric as any)?.isWordSynced
                    ? (lyric as any)?.source?.toUpperCase()
                    : "LINE SYNC"}
                </span>
              </button>

              {quickSourceDropdown === "karaoke" && (
                <div
                  className={styles.quickSourceDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.quickSourceDropdownHeader}>
                    <span>Karaoke Source (This Song)</span>
                  </div>
                  {ALL_LYRIC_SOURCES.filter((s) => s.supportsKaraoke).map((src) => {
                    const isCurrent =
                      (lyric as any)?.isWordSynced && (lyric as any)?.source === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        className={`${styles.quickSourceDropdownItem} ${
                          isCurrent ? styles.quickSourceDropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new CustomEvent("song_source_override", {
                                detail: { source: src.id, preferKaraoke: true },
                              })
                            );
                          }
                          setQuickSourceDropdown(null);
                          setToastMessage(
                            `Karaoke source changed to ${src.name} (This song)`
                          );
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                      >
                        <span>{src.name}</span>
                        {isCurrent && <span style={{ fontSize: "11px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spotify Liked Songs Permission Warning */}
      {needsReauth && (
        <div
          onClick={handleReconnect}
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(225, 29, 72, 0.95)",
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 99999,
            fontWeight: "600",
            fontSize: "14px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
          title="Click to reconnect Spotify with Liked Songs permissions"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <GruvboxIcon name="warning" size={16} />
            Spotify Liked Songs permission needed.
          </span>
          <span style={{ textDecoration: "underline", fontWeight: "bold" }}>
            Click here to reconnect
          </span>
        </div>
      )}

      {/* Apple Music Lyrics Settings Modal */}
      <AppleMusicSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        song={song}
        songImage={song?.image}
        paletteColors={paletteColors}
        lyrics={lyric}
        karokeIndex={karoke?.index}
        currentTime={currentTime}
        isPlaying={data?.is_playing || false}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Track Management Modal */}
      {showTrackModal && song && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowTrackModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Track Management</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowTrackModal(false)}
                aria-label="Close"
              >
                <GruvboxIcon name="close" size={14} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Track Title</span>
                <span className={styles.trackDetailVal}>{song.name}</span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Artist</span>
                <span className={styles.trackDetailVal}>{song.artist}</span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Album</span>
                <span className={styles.trackDetailVal}>{song.album}</span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Duration</span>
                <span className={styles.trackDetailVal}>
                  {formatTime(song.duration / 1000)}
                </span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Explicit</span>
                <span className={styles.trackDetailVal}>
                  {song.explicit ? "Yes (Explicit)" : "No (Clean)"}
                </span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>In Library</span>
                <span className={styles.trackDetailVal}>
                  {isLiked ? "Saved to Liked Songs" : "Not in Liked Songs"}
                </span>
              </div>
              <div className={styles.trackDetailRow}>
                <span className={styles.trackDetailLabel}>Track URI</span>
                <span className={styles.trackDetailVal} title={song.uri}>
                  {song.uri}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {song && song.name ? (
        <div
          className={`${styles.container} ${stylePresetClass} ${themeClass}`}
            style={
              {
                "--accent-color": paletteColors?.primary,
                "--ambient-glow": paletteColors?.glow,
                "--zoom-scale": zoomScale,
                "--active-lyric-color": lyricGradientColor,
                "--sparkle-intensity": ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),
              } as React.CSSProperties
            }
          >
            {/* Ambient Blurred Artwork Background */}
            <div
              className={`${styles.ambientBackground} ${bgClass}`}
              style={{
                backgroundImage: `url("${song.image}")`,
              }}
            />
            {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
              <AuroraMeshOrbs
                palette={paletteColors}
                isPlaying={!showSettingsModal && (data?.is_playing || false)}
                isLightMode={isLightMode}
              />
            )}
            {settings.ambientStardust && (
              <AmbientStardust
                isPlaying={!showSettingsModal && (data?.is_playing || false)}
                primaryColor={paletteColors?.primary}
                isLightMode={isLightMode}
              />
            )}
            <div
              className={styles.ambientOverlay}
              style={{
                background: isLightMode
                  ? "radial-gradient(circle at 35% 50%, rgba(245, 245, 250, 0.72) 0%, rgba(228, 230, 238, 0.90) 100%)"
                  : paletteColors?.overlayGradient || undefined,
              }}
            />

            <div className={styles.mainLayout}>
              {/* Left Panel: Album Art / Vinyl Turntable, Info, Scrubber & Playback Controls */}
              <div className={styles.leftPanel}>
                <div className={styles.playerCard}>
                  {settings.vinylMode ? (
                    <VinylTurntable
                      songImage={song.image}
                      isPlaying={!showSettingsModal && (data?.is_playing || false)}
                      trackName={song.name}
                      onTogglePlay={(e) => togglePlayback(e as any)}
                      isLightMode={isLightMode}
                      hasEdgeGlow={settings.albumEdgeGlow}
                      primaryColor={paletteColors?.primary}
                      vinylStyle={settings.vinylStyle}
                    />
                  ) : (
                    <div
                      className={`${styles.albumCoverWrapper} ${
                        data?.is_playing ? styles.coverPlaying : styles.coverPaused
                      } ${settings.albumEdgeGlow ? styles.ambientEdgeGlowActive : ""}`}
                    >
                      <div
                        className={styles.albumCoverGlow}
                        style={{
                          backgroundImage: `url(${song.image})`,
                        }}
                      />
                      <img
                        src={song.image}
                        alt={song.name}
                        className={styles.albumArtwork}
                      />
                    </div>
                  )}

                  {/* Track Title, Explicit Badge, Artist & Action Buttons */}
                  <div className={styles.trackInfoRow}>
                    <div className={styles.titleArtistCol}>
                    <div className={styles.nowPlayingKicker}>NOW PLAYING</div>
                    <div className={styles.titleRow}>
                        <h1 className={styles.trackTitle}>
                          {isHqActive && hqPlayback?.track?.title ? hqPlayback.track.title : song?.name || "Unknown Track"}
                        </h1>
                        {song?.explicit && (
                          <span
                            className={styles.explicitBadge}
                            title="Explicit Content"
                          >
                            E
                          </span>
                        )}
                      </div>
                      <h3 className={styles.artistName}>
                        {isHqActive && hqPlayback?.track?.artist ? hqPlayback.track.artist : song?.artist || "Unknown Artist"}
                      </h3>
                    </div>

                    <div className={styles.actionButtonsCol}>
                      {/* Favorite / Liked Song Star Button (Contrast-Adaptive) */}
                      <button
                        className={`${styles.circleButton} ${
                          isLiked ? styles.isFavorite : ""
                        }`}
                        onClick={toggleLiked}
                        title={
                          needsReauth
                            ? "Reconnect Spotify for Liked Songs permission"
                            : isLiked
                            ? "In Liked Songs (Click to remove)"
                            : "Add to Liked Songs"
                        }
                        aria-label="Favorite"
                        style={
                          isLiked
                            ? ({
                                "--star-fill": starContrast.fill,
                                "--star-btn-bg": starContrast.btnBg,
                                "--star-btn-border": starContrast.btnBorder,
                                "--star-btn-shadow": starContrast.btnShadow,
                                "--star-filter": starContrast.filter,
                              } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isLiked ? starContrast.fill : "none"}
                          stroke={isLiked ? starContrast.stroke : "currentColor"}
                          strokeWidth={isLiked ? "1.5" : "2"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`${styles.favoriteStarSvg} ${
                            isLiked ? styles.favoriteStarActive : ""
                          }`}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </button>

                      {/* 3-Dots More Options Button with Apple Music Popover Menu */}
                      <div className={styles.optionsMenuWrapper} ref={menuRef}>
                        <button
                          className={styles.circleButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu((prev) => !prev);
                          }}
                          title="More Options"
                          aria-label="More Options"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="5" cy="12" r="2.2"></circle>
                            <circle cx="12" cy="12" r="2.2"></circle>
                            <circle cx="19" cy="12" r="2.2"></circle>
                          </svg>
                        </button>

                        {/* Dropup Context Menu */}
                        {showMenu && (
                          <div
                            className={styles.optionsMenu}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* 1. Delete / Add from Library */}
                            <button
                              className={`${styles.menuItem} ${
                                isLiked ? styles.danger : ""
                              }`}
                              onClick={(e) => {
                                toggleLiked(e);
                                setShowMenu(false);
                                showToast(
                                  isLiked
                                    ? "Removed from Library"
                                    : "Added to Library"
                                );
                              }}
                            >
                              <span>
                                {isLiked
                                  ? "Delete from Library"
                                  : "Add to Library"}
                              </span>
                              <span className={styles.menuItemIcon}>
                                {isLiked ? (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                ) : (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                )}
                              </span>
                            </button>

                            {/* 2. Apple Music Lyrics Settings */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                setShowSettingsModal(true);
                              }}
                            >
                              <span>Nocturne Lyrics Studio</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="4" y1="21" x2="4" y2="14"></line>
                                  <line x1="4" y1="10" x2="4" y2="3"></line>
                                  <line x1="12" y1="21" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12" y2="3"></line>
                                  <line x1="20" y1="21" x2="20" y2="16"></line>
                                  <line x1="20" y1="12" x2="20" y2="3"></line>
                                  <line x1="1" y1="14" x2="7" y2="14"></line>
                                  <line x1="9" y1="8" x2="15" y2="8"></line>
                                  <line x1="17" y1="16" x2="23" y2="16"></line>
                                </svg>
                              </span>
                            </button>

                            {/* 3. Show Artist */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                const target = song?.artistId
                                  ? `spotify:artist:${song.artistId}`
                                  : `https://open.spotify.com/search/${encodeURIComponent(
                                      song?.artist || ""
                                    )}`;
                                openTargetUrl(target, "Opening Artist in Spotify...");
                              }}
                            >
                              <span>Show Artist</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"></path>
                                  <circle cx="17" cy="7" r="5"></circle>
                                </svg>
                              </span>
                            </button>

                            {/* 4. Show Album */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                const target = song?.albumId
                                  ? `spotify:album:${song.albumId}`
                                  : `https://open.spotify.com/search/${encodeURIComponent(
                                      song?.album || ""
                                    )}`;
                                openTargetUrl(target, "Opening Album in Spotify...");
                              }}
                            >
                              <span>Show Album</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M8 3h8"></path>
                                  <rect
                                    x="5"
                                    y="6"
                                    width="14"
                                    height="15"
                                    rx="3"
                                  ></rect>
                                </svg>
                              </span>
                            </button>

                            {/* 5. Open Track Management */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                setShowTrackModal(true);
                              }}
                            >
                              <span>Open Track Management</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path>
                                </svg>
                              </span>
                            </button>

                            {/* 6. Copy Spotify URI */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                if (song?.uri) {
                                  navigator.clipboard.writeText(song.uri);
                                  showToast("Copied Spotify URI");
                                }
                              }}
                            >
                              <span>Copy Spotify URI</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="17 8 21 12 17 16"></polyline>
                                  <polyline points="7 8 3 12 7 16"></polyline>
                                  <line x1="14" y1="4" x2="10" y2="20"></line>
                                </svg>
                              </span>
                            </button>

                            {/* 7. Copy Spotify link */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                const link =
                                  song?.externalUrl ||
                                  (song?.id
                                    ? `https://open.spotify.com/track/${song.id}`
                                    : "");
                                if (link) {
                                  navigator.clipboard.writeText(link);
                                  showToast("Copied Spotify link");
                                }
                              }}
                            >
                              <span>Copy Spotify link</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                  <polyline points="16 6 12 2 8 6"></polyline>
                                  <line x1="12" y1="2" x2="12" y2="15"></line>
                                </svg>
                              </span>
                            </button>

                            {/* 8. Show in Spotify */}
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setShowMenu(false);
                                const target =
                                  song?.uri ||
                                  (song?.externalUrl ||
                                    (song?.id
                                      ? `spotify:track:${song.id}`
                                      : ""));
                                if (target) {
                                  openTargetUrl(target, "Opening in Spotify...");
                                }
                              }}
                            >
                              <span>Show in Spotify</span>
                              <span className={styles.menuItemIcon}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                </svg>
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${styles.collapsibleControls} ${
                      isControlsIdle && settings.cinemaMode && !showMenu ? styles.controlsHidden : ""
                    }`}
                    onMouseEnter={() => setIsControlsIdle(false)}
                  >
                    {/* Scrubber / Progress Bar */}
                  {(() => {
                    const displayTime =
                      optimisticTime !== null ? optimisticTime : currentTime;

                    const displayProgressPct =
                      song.duration > 0
                        ? Math.min(
                            100,
                            Math.max(0, ((displayTime * 1000) / song.duration) * 100)
                          )
                        : 0;

                    return (
                      <div className={styles.scrubberContainer}>
                        {settings.wavyProgress ? (
                          <RiffWavyProgressBar
                            currentTime={displayTime}
                            duration={song.duration ? song.duration / 1000 : 0}
                            isPlaying={!showSettingsModal && (data?.is_playing || false)}
                            onSeek={(targetSec) => seekTo(targetSec)}
                            primaryColor={paletteColors?.primary || (isLightMode ? "#0f172a" : "#ffffff")}
                            isLightMode={isLightMode}
                            waveformStyle={settings.waveformStyle}
                            isSkipping={isSkipping}
                            isSeeking={isSeeking}
                          />
                        ) : (
                          <div
                            className={styles.scrubberTrack}
                            onClick={handleScrubberClick}
                            title="Seek"
                          >
                            <div
                              className={`${styles.scrubberProgress} ${
                                isSkipping
                                  ? styles.scrubberRewinding
                                  : isSeeking
                                  ? styles.scrubberSeeking
                                  : ""
                              }`}
                              style={{
                                width: `${displayProgressPct}%`,
                              }}
                            />
                          </div>
                        )}
                        <div className={styles.timeRow}>
                          <span className={styles.timeDigit}>
                            {formatTime(displayTime)}
                          </span>
                          <span className={styles.timeDigit}>
                            {formatRemaining(song.duration, displayTime)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Playback Controls Row: Shuffle, Prev, Play/Pause, Next, Repeat */}
                  <div className={styles.controlsRow}>
                    {/* Shuffle Toggle */}
                    <button
                      className={`${styles.ctrlButton} ${
                        data?.shuffle_state ? styles.activeFeature : ""
                      }`}
                      onClick={toggleShuffle}
                      title={data?.shuffle_state ? "Shuffle On" : "Shuffle Off"}
                      aria-label="Shuffle"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 3 21 3 21 8"></polyline>
                        <line x1="4" y1="20" x2="21" y2="3"></line>
                        <polyline points="21 16 21 21 16 21"></polyline>
                        <line x1="15" y1="15" x2="21" y2="21"></line>
                        <line x1="4" y1="4" x2="9" y2="9"></line>
                      </svg>
                    </button>

                    {/* Previous Track */}
                    <button
                      className={styles.ctrlButton}
                      onClick={previousTrack}
                      title="Previous Track"
                      aria-label="Previous Track"
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 6h2.5v12H6zm3.5 6l9 6.5V5.5z" />
                      </svg>
                    </button>

                    {/* Play / Pause */}
                    <button
                      className={`${styles.ctrlButton} ${styles.playPause}`}
                      onClick={togglePlayback}
                      title={data?.is_playing ? "Pause" : "Play"}
                      aria-label={data?.is_playing ? "Pause" : "Play"}
                    >
                      {data?.is_playing ? (
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M6 5h3.5v14H6V5zm8.5 0H18v14h-3.5V5z" />
                        </svg>
                      ) : (
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Next Track */}
                    <button
                      className={styles.ctrlButton}
                      onClick={nextTrack}
                      title="Next Track"
                      aria-label="Next Track"
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5.5 18.5l9-6.5-9-6.5v13zM15.5 6H18v12h-2.5V6z" />
                      </svg>
                    </button>

                    {/* Repeat Toggle */}
                    <button
                      className={`${styles.ctrlButton} ${
                        data?.repeat_state && data.repeat_state !== "off"
                          ? styles.activeFeature
                          : ""
                      }`}
                      onClick={toggleRepeat}
                      title={`Repeat: ${data?.repeat_state || "off"}`}
                      aria-label="Repeat"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="17 1 21 5 17 9"></polyline>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <polyline points="7 23 3 19 7 15"></polyline>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                      </svg>
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Apple Music Karaoke Lyrics */}
              <div className={styles.rightPanel}>
                <div
                  ref={scrollerRef}
                  onMouseEnter={() => setIsHoveringScroller(true)}
                  onMouseLeave={() => setIsHoveringScroller(false)}
                  onWheel={handleLyricsWheel}
                  className={`${styles.lyricsScroller} ${
                    settings.rightAlignFirst ? styles.alignRightAll : ""
                  } ${
                    isHoveringScroller && settings.autoUnblur
                      ? styles.unblurredAll
                      : ""
                  }`}
                  style={
                    {
                      "--inactive-blur": `${blurPx}px`,
                      "--lyrics-weight": settings.boldText ? "850" : "700",
                      "--lyrics-font": fontStack,
                    } as React.CSSProperties
                  }
                  id="lyrics-scroller"
                >
                  <div
                    className={`${styles.elasticContent} ${
                      isPullBouncing ? styles.elasticContentBouncing : ""
                    }`}
                    style={{
                      transform: `translateY(${pullOffset}px)`,
                    }}
                  >
                    {lyric && lyric.synced && Array.isArray(lyric.lyrics) && lyric.lyrics.length > 0 ? (
                      lyric.lyrics.map((l, i) => {
                        const nextSeconds =
                          i + 1 < lyric.lyrics.length
                            ? lyric.lyrics[i + 1].seconds
                            : song.duration
                            ? song.duration / 1000
                            : l.seconds + 4;

                        // Check for instrumental breaks
                        const showIntroBreak =
                          i === 0 &&
                          settings.instrumentalBreaks &&
                          l.seconds > 3.5;
                        const introRemaining = Math.max(0, l.seconds - currentTime);
                        const isIntroActive = currentTime < l.seconds - 0.4;

                        const hasInterBreak =
                          settings.instrumentalBreaks &&
                          nextSeconds - l.seconds > 6.0;
                        const breakStart = l.seconds + 2.5;
                        const breakRemaining = Math.max(0, nextSeconds - currentTime);
                        const isInterActive =
                          currentTime >= breakStart && currentTime < nextSeconds - 0.4;

                        return (
                          <Fragment key={i}>
                            {showIntroBreak && (
                              <InstrumentalBreak
                                remainingSeconds={introRemaining}
                                totalSeconds={l.seconds}
                                isActive={isIntroActive}
                                onSeek={seek}
                                targetSeconds={Math.max(0, l.seconds - 1)}
                                primaryColor={paletteColors?.primary}
                                isLightMode={isLightMode}
                              />
                            )}

                            <KaraokeLine
                              line={l}
                              index={i}
                              isActive={karoke?.index === i}
                              nextSeconds={nextSeconds}
                              currentTime={currentTime}
                              isPlaying={data?.is_playing || false}
                              settings={settings}
                              onSeek={seek}
                            />

                            {hasInterBreak && (
                              <InstrumentalBreak
                                remainingSeconds={breakRemaining}
                                totalSeconds={nextSeconds - breakStart}
                                isActive={isInterActive}
                                onSeek={seek}
                                targetSeconds={breakStart}
                                primaryColor={paletteColors?.primary}
                                isLightMode={isLightMode}
                              />
                            )}
                          </Fragment>
                        );
                      })
                    ) : lyric && !lyric.synced && lyric?.lyrics ? (
                      <p className={`${styles.lyricLine} ${styles.active}`}>
                        {lyric.lyrics}
                      </p>
                    ) : (
                      <div className={styles.noLyricsState}>
                        <span>Loading lyrics...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Lyric Source Indicator */}
                {(lyric as any)?.source && (
                  <div
                    className={styles.lyricSourceIndicator}
                    title={`Loaded via ${(lyric as any).source.toUpperCase()}${(lyric as any).isWordSynced ? " (Word-by-word Karaoke)" : ""}${(lyric as any).isFallbackToBase ? " • Default version fallback" : (lyric as any).variantDetected ? " • Exact variant matched" : ""}. Click to customize priorities.`}
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <span className={styles.sourceDot} />
                    <span>{(lyric as any).source.toUpperCase()}</span>
                    {(lyric as any).isWordSynced && (
                      <span className={styles.wordSyncBadge}>KARAOKE</span>
                    )}
                    {(lyric as any).variantDetected && !(lyric as any).isFallbackToBase && (
                      <span className={styles.wordSyncBadge} style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff" }}>
                        VARIANT
                      </span>
                    )}
                    {(lyric as any).isFallbackToBase && (
                      <span className={styles.wordSyncBadge} style={{ background: "rgba(255, 255, 255, 0.12)", color: "rgba(255, 255, 255, 0.7)" }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                )}

                {/* Audio Reactive Canvas / Spectrum Visualizer */}
                {settings.spectrumVisualizer && (
                  <AudioSpectrumVisualizer
                    isPlaying={!showSettingsModal && (data?.is_playing || false)}
                    primaryColor={paletteColors?.primary || "#38bdf8"}
                    glowColor={paletteColors?.glow}
                    isLightMode={isLightMode}
                    spectrumStyle={settings.spectrumStyle}
                    analyserNode={hqPlayback?.analyserNode || null}
                  />
                )}
              </div>
            </div>
          </div>
        ) : session && status === "authenticated" ? (
          <NotPlaying onOpenSettings={() => setShowSettingsModal(true)} />
        ) : (
          <Signin />
        )}
    </>
  );
}

export const parseLyrics = (text: string) => {
  if (!text) return <span style={{ opacity: 0.5 }}>...</span>;
  const parts = text.split(/(\([^)]+\))/g);

  const joined = parts.join("");
  if (joined.startsWith("(") && joined.endsWith(")")) {
    return <span style={{ opacity: 0.65 }}>{parts}</span>;
  }
  return parts.map((part, index) => {
    if (part.startsWith("(") && part.endsWith(")")) {
      return (
        <span key={index} style={{ opacity: 0.65 }}>
          {part}
        </span>
      );
    } else {
      return <Fragment key={index}>{part}</Fragment>;
    }
  });
};
