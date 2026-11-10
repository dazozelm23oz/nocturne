import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { tokenizeLyric, LyricToken } from "@/lib/lyricTokenizer";
import styles from "@/styles/SettingsModal.module.css";
import {
  LyricsSettings,
  HqQualityOption,
  ThemeOption,
  BackgroundOption,
  PaletteAlgorithmOption,
  FontPresetOption,
  FloatAnimationOption,
  PullingEffectOption,
  StylePresetOption,
  LyricEasingOption,
  LyricSpeedOption,
  LyricGradientOption,
  LyricMovementOption,
  LyricColorScopeOption,
  SpectrumStyleOption,
  VinylStyleOption,
  WaveformStyleOption,
} from "@/typings/LyricsSettings";
import { extractPalette, PaletteColors } from "@/lib/paletteExtractor";
import AudioSpectrumVisualizer from "@/components/AudioSpectrumVisualizer";
import AuroraMeshOrbs from "@/components/AuroraMeshOrbs";
import InstrumentalBreak from "@/components/InstrumentalBreak";
import RiffWavyProgressBar from "@/components/RiffWavyProgressBar";
import AmbientStardust from "@/components/AmbientStardust";
import { GruvboxIcon, GruvboxIconName } from "@/components/icons/GruvboxIcon";
import { ALL_LYRIC_SOURCES, DEFAULT_LYRIC_SOURCES_PRIORITY, DEFAULT_KARAOKE_SOURCES_PRIORITY, LyricSourceId } from "@/lib/lyricsSources";
import { usePerformanceMetrics } from "@/lib/performanceMetrics";
import { getActivePlayers } from "@/lib/localMediaBridge";

function parseRgbString(colorStr?: string): string {
  if (!colorStr) return "29, 185, 84";
  if (colorStr.startsWith("rgb")) {
    const nums = colorStr.match(/\d+/g);
    if (nums && nums.length >= 3) {
      return `${nums[0]}, ${nums[1]}, ${nums[2]}`;
    }
  }
  if (colorStr.startsWith("#")) {
    const hex = colorStr.replace("#", "");
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ].join(", ");
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ].join(", ");
    }
  }
  return "29, 185, 84";
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LyricsSettings;
  song?: {
    name?: string;
    artist?: string;
    artists?: string;
    image?: string;
    duration?: number;
  } | null;
  songImage?: string;
  paletteColors?: PaletteColors | null;
  lyrics?: any;
  karokeIndex?: number | null;
  currentTime?: number;
  isPlaying?: boolean;
  onUpdateSettings: (updater: (prev: LyricsSettings) => LyricsSettings) => void;
}

interface StudioLivePreviewProps {
  settings: LyricsSettings;
  song?: {
    name?: string;
    artist?: string;
    artists?: string;
    image?: string;
    duration?: number;
  } | null;
  songImage?: string;
  previewPalette: PaletteColors | null;
  blurPx: number;
  previewFont: string;
  previewScale: number;
  previewActiveSize: string;
  previewInactiveColor: string;
  previewLyricActiveColor: string;
  previewOverlayBg?: string;
  previewFloatStyle: React.CSSProperties;
  previewAmbientStyle: React.CSSProperties;
  linePrev: string;
  lineActive: string;
  lineNext: string;
  isLightMode: boolean;
  currentPullPower: number;
  onLeftPaneWheel?: (e: React.WheelEvent) => void;
}

const StudioLivePreviewPane = React.memo(function StudioLivePreviewPane({
  settings,
  song,
  songImage,
  previewPalette,
  blurPx,
  previewFont,
  previewScale,
  previewActiveSize,
  previewInactiveColor,
  previewLyricActiveColor,
  previewOverlayBg,
  previewFloatStyle,
  previewAmbientStyle,
  linePrev,
  lineActive,
  lineNext,
  isLightMode,
  currentPullPower,
  onLeftPaneWheel,
}: StudioLivePreviewProps) {
  const [previewSweepProgress, setPreviewSweepProgress] = useState<number>(45);
  const activeTokens = useMemo(() => tokenizeLyric(lineActive), [lineActive]);

  // Smooth RAF sweep loop for karaoke lyric sweep preview
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setPreviewSweepProgress((prev) => {
        const next = prev + (deltaSec / 3.4) * 100;
        return next >= 100 ? 0 : next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const previewDynamicSweepBg = previewLyricActiveColor;

  return (
    <div className={styles.previewStudioPane} onWheel={onLeftPaneWheel}>
      {/* Riff & Apple TV Espresso Top Card */}
      <div className={styles.studioPreviewTopCard}>
        {songImage ? (
          <img
            src={songImage}
            alt={song?.name || "Album Art"}
            className={styles.studioAlbumArt}
          />
        ) : (
          <div className={styles.studioAlbumArtPlaceholder}>
            <GruvboxIcon name="image" size={32} color="var(--modal-text-dim)" />
          </div>
        )}
        <span className={styles.studioNowPlayingTag}>NOW PLAYING</span>
        <h2 className={styles.studioSongTitle} title={song?.name || "Espresso"}>
          {song?.name || "Espresso"}
        </h2>
        <p className={styles.studioArtistTitle} title={song?.artist || song?.artists || "Sabrina Carpenter"}>
          {song?.artist || song?.artists || "Sabrina Carpenter"}
        </p>
      </div>

      {/* Pure Lyrics Stage - Clean, unencumbered preview */}
      <div className={styles.studioStage} style={{ position: "relative", overflow: "hidden", flex: 1 }}>
        <div
          className={styles.previewAmbient}
          style={previewAmbientStyle}
        />
        {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
          <AuroraMeshOrbs
            palette={previewPalette}
            isPlaying={true}
            isLightMode={isLightMode}
          />
        )}
        {settings.ambientStardust && (
          <AmbientStardust
            isPlaying={true}
            primaryColor={previewPalette?.primary}
            isLightMode={isLightMode}
          />
        )}
        <div
          className={styles.previewOverlay}
          style={{
            background: previewOverlayBg,
          }}
        />

        <div className={styles.studioElasticWrap}>
          {/* Lyrics Presentation: Pure Synchronized Lyrics */}
          <div
            className={styles.studioLyricsBox}
            style={{
              alignItems: settings.rightAlignFirst ? "flex-end" : "center",
              textAlign: settings.rightAlignFirst ? "right" : "center",
            }}
          >
            {/* Previous Inactive Line */}
            <p
              className={styles.previewInactiveLine}
              style={{
                filter: `blur(${blurPx}px)`,
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 800 : 600,
                color: previewInactiveColor,
              }}
            >
              {linePrev}
            </p>

            {/* Instrumental Break Dots Preview */}
            {settings.instrumentalBreaks && (
              <div
                style={{
                  display: "flex",
                  justifyContent: settings.rightAlignFirst ? "flex-end" : "center",
                  width: "100%",
                  margin: "6px 0",
                }}
              >
                <InstrumentalBreak
                  remainingSeconds={Math.max(0, 4 - Math.floor(previewSweepProgress / 25))}
                  totalSeconds={4}
                  isActive={previewSweepProgress < 35}
                  primaryColor={previewLyricActiveColor}
                  isLightMode={isLightMode}
                />
              </div>
            )}

            {/* Active Singing Line (Sequential Multi-Line Sweep) */}
            <p
              className={`${styles.previewActiveLine} ${
                settings.wordShine ? styles.previewWordShine : ""
              } ${
                settings.particleSparkle ? styles.particleSparkleActive : ""
              }`}
              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: previewActiveSize,
                color: previewLyricActiveColor,
                transform: `scale(${previewScale})`,
                transformOrigin: settings.rightAlignFirst ? "right center" : "center center",
                ...(settings.floatAnimation !== "Off" ? previewFloatStyle : {}),
                ["--sparkle-intensity" as any]: ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),
              }}
            >
              {settings.karaokeMode ? (
                activeTokens.tokens.map((token: LyricToken, idx: number) => {
                  const startPct = token.startFrac * 100;
                  const endPct = token.endFrac * 100;
                  const isPast = previewSweepProgress >= endPct;
                  const isCurrent = previewSweepProgress >= startPct && previewSweepProgress < endPct;
                  const localPct = isCurrent
                    ? ((previewSweepProgress - startPct) / Math.max(0.001, endPct - startPct)) * 100
                    : isPast ? 100 : 0;

                  const isLastToken = idx === activeTokens.tokens.length - 1;
                  const magnifyScale = isCurrent && settings.syllableMagnify !== false ? (isLastToken ? 1.20 : 1.14) : 1;
                  const magnifyY = isCurrent && settings.syllableMagnify !== false ? -2 : 0;

                  return (
                    <span
                      key={idx}
                      className={styles.previewWordToken}
                      style={{
                        display: "inline-block",
                        marginRight: token.isSpace ? "0.28em" : "0.05em",
                        transform: `scale(${magnifyScale}) translateY(${magnifyY}px)`,
                        transformOrigin: "50% 80%",
                        transition: "transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        background: (isCurrent || isPast) ? previewLyricActiveColor : previewInactiveColor,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        maskImage: isCurrent
                          ? `linear-gradient(to right, #000 0%, #000 ${localPct}%, rgba(0,0,0,0.38) ${Math.min(100, localPct + 4)}%, rgba(0,0,0,0.38) 100%)`
                          : undefined,
                        WebkitMaskImage: isCurrent
                          ? `linear-gradient(to right, #000 0%, #000 ${localPct}%, rgba(0,0,0,0.38) ${Math.min(100, localPct + 4)}%, rgba(0,0,0,0.38) 100%)`
                          : undefined,
                        textShadow: isPast || isCurrent ? `0 0 20px ${previewPalette?.glow || "rgba(255,255,255,0.4)"}` : "none",
                      }}
                    >
                      {token.text}
                    </span>
                  );
                })
              ) : (
                <span
                  style={{
                    background: previewDynamicSweepBg,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    maskImage: `linear-gradient(to right, #000 0%, #000 ${previewSweepProgress}%, rgba(0,0,0,0.38) ${Math.min(100, previewSweepProgress + 5)}%, rgba(0,0,0,0.38) 100%)`,
                    WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 ${previewSweepProgress}%, rgba(0,0,0,0.38) ${Math.min(100, previewSweepProgress + 5)}%, rgba(0,0,0,0.38) 100%)`,
                    display: "inline-block",
                  }}
                >
                  {lineActive}
                </span>
              )}
            </p>

            {/* Next Inactive Line */}
            <p
              className={styles.previewInactiveLine}
              style={{
                filter: `blur(${blurPx}px)`,
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 800 : 600,
                color: previewInactiveColor,
              }}
            >
              {lineNext}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function AppleMusicSettingsModal({
  isOpen,
  onClose,
  settings,
  song,
  songImage,
  paletteColors,
  lyrics,
  karokeIndex,
  currentTime,
  isPlaying,
  onUpdateSettings,
}: SettingsModalProps) {
  const [viewMode, setViewMode] = useState<"split" | "docked" | "centered">("split");
  const [activeCategory, setActiveCategory] = useState<"all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sidebarCategories = useMemo<
    { id: "all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance"; label: string; icon: GruvboxIconName }[]
  >(
    () => [
      { id: "all", label: "All Settings", icon: "magic" },
      { id: "appearance", label: "Interface & Theme", icon: "palette" },
      { id: "lyrics", label: "Lyrics & Motion", icon: "chat" },
      { id: "sources", label: "Lyric Sources & Priority", icon: "focus" },
      { id: "visuals", label: "Visual Effects", icon: "waves" },
      { id: "playback", label: "Sync & Spotify", icon: "gear" },
      { id: "performance", label: "Performance", icon: "thunderbolt" },
    ],
    []
  );
  const handleCategoryChange = useCallback(
    (cat: "all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance") => {
      setActiveCategory(cat);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    },
    []
  );

    const moveLyricSource = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentList = [...(settings.lyricSourcesPriority || DEFAULT_LYRIC_SOURCES_PRIORITY)];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;
    onUpdateSettings((prev) => ({
      ...prev,
      lyricSourcesPriority: currentList,
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.lyricSourcesPriority, onUpdateSettings]);

  const moveKaraokeSource = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentList = [...(settings.karaokeSourcesPriority || DEFAULT_KARAOKE_SOURCES_PRIORITY)];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;
    onUpdateSettings((prev) => ({
      ...prev,
      karaokeSourcesPriority: currentList,
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.karaokeSourcesPriority, onUpdateSettings]);

  const toggleSourceEnabled = useCallback((sourceId: LyricSourceId) => {
    const disabled = new Set(settings.disabledLyricSources || []);
    if (disabled.has(sourceId)) {
      disabled.delete(sourceId);
    } else {
      disabled.add(sourceId);
    }
    onUpdateSettings((prev) => ({
      ...prev,
      disabledLyricSources: Array.from(disabled),
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.disabledLyricSources, onUpdateSettings]);

  const scrollToAnchor = useCallback((id: string) => {
    const container = modalBodyRef.current;
    const el = document.getElementById(id);
    if (container && el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: Math.max(0, relativeTop - 12), behavior: "smooth" });
    }
  }, []);

  const isPerfActive = isOpen && activeCategory === "performance";
  const {
    lyricsLoad,
    skipSpeed,
    playbackToggle,
    seekAction,
    fps,
    gpuInfo,
    sysStats,
    resetMetrics,
  } = usePerformanceMetrics(isPerfActive);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownDropUp, setDropdownDropUp] = useState<boolean>(false);

  const toggleDropdown = useCallback(
    (id: string, e?: React.MouseEvent<HTMLButtonElement>) => {
      setOpenDropdown((cur) => {
        if (cur === id) return null;
        if (e && e.currentTarget) {
          const btnRect = e.currentTarget.getBoundingClientRect();
          const modalBody = modalBodyRef.current;
          if (modalBody) {
            const bodyRect = modalBody.getBoundingClientRect();
            const spaceBelow = bodyRect.bottom - btnRect.bottom;
            const spaceAbove = btnRect.top - bodyRect.top;
            setDropdownDropUp(spaceBelow < 220 && spaceAbove > 220);
          } else {
            setDropdownDropUp(window.innerHeight - btnRect.bottom < 250);
          }
        } else {
          setDropdownDropUp(false);
        }
        return id;
      });
    },
    []
  );
  const [karaokeExpanded, setKaraokeExpanded] = useState<boolean>(true);
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [previewPalette, setPreviewPalette] = useState<PaletteColors | null>(paletteColors || null);
  const [realGpu, setRealGpu] = useState<string>("Detecting...");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      import("@tauri-apps/api/core").then(({ invoke }) => {
        invoke<string>("get_real_gpu")
          .then((res) => {
            if (res && res.trim()) {
              setRealGpu(res.trim());
            } else {
              setRealGpu("Unknown GPU");
            }
          })
          .catch(() => setRealGpu("Unknown GPU"));
      });
    } else {
      setRealGpu("WebKit Masked Renderer");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getActivePlayers().then((players) => {
        if (Array.isArray(players)) setActivePlayers(players);
      }).catch(() => {});
      const interval = setInterval(() => {
        getActivePlayers().then((players) => {
          if (Array.isArray(players)) setActivePlayers(players);
        }).catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (paletteColors) {
      setPreviewPalette(paletteColors);
    }
  }, [paletteColors]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const pullPowerMap: Record<PullingEffectOption, number> = {
    Disabled: 0,
    Low: 0.35,
    Regular: 0.7,
    "Medium (Default)": 1.0,
    High: 1.45,
    Tremendous: 2.1,
  };
  const currentPullPower = pullPowerMap[settings.pullingEffect] ?? 1.0;

  // Preview lyric lines from real current song or fallback (Espresso Apple TV reference)
  const fallbackLines = [
    "Say you can't sleep, baby, I know",
    "I can't relate to desperation",
    "My give-a-fucks are on vacation",
  ];

  let linePrev = fallbackLines[0];
  let lineActive = fallbackLines[1];
  let lineNext = fallbackLines[2];

  if (lyrics && Array.isArray(lyrics.lyrics) && lyrics.lyrics.length > 0) {
    const activeIdx =
      typeof karokeIndex === "number" &&
      karokeIndex >= 0 &&
      karokeIndex < lyrics.lyrics.length
        ? karokeIndex
        : 0;
    lineActive = lyrics.lyrics[activeIdx]?.words || fallbackLines[1];
    if (activeIdx > 0 && lyrics.lyrics[activeIdx - 1]?.words) {
      linePrev = lyrics.lyrics[activeIdx - 1].words;
    }
    if (activeIdx + 1 < lyrics.lyrics.length && lyrics.lyrics[activeIdx + 1]?.words) {
      lineNext = lyrics.lyrics[activeIdx + 1].words;
    }
  }

  // Ref to modal body for wheel forwarding from left pane
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const handleLeftPaneWheel = useCallback((e: React.WheelEvent) => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop += e.deltaY;
    }
  }, []);

  useEffect(() => {
    if (songImage) {
      extractPalette(songImage, settings.paletteAlgorithm).then((pal) => {
        setPreviewPalette(pal);
      });
    }
  }, [songImage, settings.paletteAlgorithm]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(`.${styles.dropdownButton}`)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener("click", handleGlobalClick);
    }
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, [openDropdown]);

    // Dynamic RGB extraction helper
  // WCAG Luminance & Contrast Calculator
  const getLuminance = (rgbStr: string): number => {
    const parts = rgbStr.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length < 3) return 0.5;
    const [r, g, b] = parts.map((val) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const getRgbFromColor = (colorStr?: string): string => {
    if (!colorStr) return "29, 185, 84";
    if (colorStr.startsWith("#")) {
      const hex = colorStr.replace("#", "");
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `${r}, ${g}, ${b}`;
      } else if (hex.length >= 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
    } else if (colorStr.startsWith("rgb")) {
      const match = colorStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (match) return `${match[1]}, ${match[2]}, ${match[3]}`;
    }
    return "29, 185, 84";
  };

  const handleQuitApp = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("close_app");
        return;
      }
    } catch {
      // fallback
    }
    try {
      await fetch("/api/system/exit", { method: "POST" });
    } catch {
      // fallback
    }
    if (typeof window !== "undefined") {
      window.close();
    }
  }, []);

  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";
  // Only use light mode if explicitly selected by the user. Auto mode keeps an ambient, elegant tinted theme.
  const isLightMode = settings.theme === "Light";

  const modalThemeVars = useMemo(() => {
    const glassBlur = settings.modalGlassBlur ?? 28;
    const glassOpacity = Math.max(0.0, Math.min(1.0, (settings.modalGlassOpacity ?? 75) / 100));

    if (isLightMode) {
      return {
        "--modal-backdrop-blur": `${glassBlur}px`,
        "--modal-window-bg": `rgba(252, 252, 254, ${Math.max(0.92, glassOpacity)})`,
        "--modal-header-bg": `rgba(244, 244, 248, 0.98)`,
        "--sidebar-bg": "rgba(0, 0, 0, 0.04)",
        "--modal-border": "rgba(0, 0, 0, 0.16)",
        "--modal-text": "#09090b",
        "--modal-text-dim": "#3f3f46",
        "--modal-title-color": "#09090b",
        "--dropdown-text": "#111113",
        "--dropdown-bg": "rgba(235, 235, 240, 0.95)",
        "--dropdown-border": "rgba(0, 0, 0, 0.14)",
        "--stepper-text": "#111113",
        "--stepper-bg": "rgba(0, 0, 0, 0.08)",
        "--btn-neutral-bg": "rgba(0, 0, 0, 0.06)",
        "--btn-neutral-border": "rgba(0, 0, 0, 0.14)",
        "--btn-neutral-hover": "rgba(0, 0, 0, 0.12)",
        "--btn-neutral-color": "#18181b",
        "--palette-primary": "#0062cc",
        "--palette-primary-rgb": "0, 98, 204",
        "--palette-contrast": "#ffffff",
        "--palette-glow": "rgba(0, 98, 204, 0.35)",
      } as React.CSSProperties;
    }

    if (isAutoTheme && previewPalette) {
      const m3 = previewPalette.m3;
      const primary = m3?.primary || previewPalette.primary || "#1db954";
      const rgb = getRgbFromColor(primary);
      const primaryLum = getLuminance(rgb);
      // Strict WCAG luminance check: threshold > 0.5
      const isLightAccent = Boolean(previewPalette.isLight) || primaryLum > 0.5;
      const contrast = primaryLum > 0.5 ? "#111113" : "#ffffff";
      const glow = previewPalette.glow || `rgba(${rgb}, 0.45)`;

      const surfaceRgb = (isLightAccent ? "245, 245, 248" : "18, 18, 22");
      const surfaceContainerRgb = (isLightAccent ? "235, 235, 240" : "26, 26, 32");
      const outlineRgb = rgb;
      const surfaceLum = getLuminance(surfaceRgb);
      const isSurfaceLight = surfaceLum > 0.5;
      const onSurface = isSurfaceLight ? "#111113" : "#ffffff";
      const onSurfaceVariant = isSurfaceLight ? "#27272a" : "rgba(255, 255, 255, 0.85)";

      const dropdownText = isSurfaceLight ? "#111113" : "#ffffff";
      const stepperText = isSurfaceLight ? "#111113" : "#ffffff";
      const dropdownBg = isSurfaceLight ? "rgba(240, 240, 245, 0.98)" : "rgba(30, 30, 36, 0.98)";
      const dropdownBorder = isSurfaceLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.16)";
      const stepperBg = isSurfaceLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)";

      const modalWindowBg = isLightAccent
        ? `rgba(250, 250, 252, ${Math.max(0.92, glassOpacity)})`
        : previewPalette.overlayGradient
        ? `linear-gradient(145deg, rgba(${surfaceRgb}, ${glassOpacity}), rgba(10, 10, 14, ${Math.min(1, glassOpacity + 0.08)})), ${previewPalette.overlayGradient}`
        : `rgba(${surfaceRgb}, ${glassOpacity})`;

      return {
        "--palette-primary": primary,
        "--palette-primary-rgb": rgb,
        "--palette-contrast": contrast,
        "--palette-glow": glow,
        "--modal-backdrop-blur": `${glassBlur}px`,
        "--modal-window-bg": modalWindowBg,
        "--modal-header-bg": isLightAccent ? `rgba(240, 240, 245, 0.98)` : `rgba(${surfaceRgb}, ${Math.min(0.96, glassOpacity + 0.12)})`,
        "--sidebar-bg": isLightAccent ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.25)",
        "--modal-card-bg": isLightAccent ? `rgba(0, 0, 0, 0.04)` : `rgba(${surfaceContainerRgb}, 0.42)`,
        "--modal-card-border": isLightAccent ? `rgba(0, 0, 0, 0.12)` : `rgba(${outlineRgb}, 0.24)`,
        "--modal-border": isLightAccent ? `rgba(0, 0, 0, 0.15)` : `rgba(${outlineRgb}, 0.28)`,
        "--modal-text": onSurface,
        "--modal-text-dim": onSurfaceVariant,
        "--modal-title-color": isLightAccent ? "#09090b" : primary,
        "--dropdown-text": dropdownText,
        "--dropdown-bg": dropdownBg,
        "--dropdown-border": dropdownBorder,
        "--stepper-text": stepperText,
        "--stepper-bg": stepperBg,
        "--btn-neutral-bg": isLightAccent ? `rgba(0, 0, 0, 0.06)` : `rgba(${rgb}, 0.12)`,
        "--btn-neutral-border": isLightAccent ? `rgba(0, 0, 0, 0.12)` : `rgba(${outlineRgb}, 0.24)`,
        "--btn-neutral-hover": isLightAccent ? `rgba(0, 0, 0, 0.1)` : `rgba(${rgb}, 0.22)`,
        "--btn-neutral-color": onSurface,
      } as React.CSSProperties;
    }

    // Dark Theme default
    return {
      "--modal-backdrop-blur": `${glassBlur}px`,
      "--modal-window-bg": `rgba(18, 18, 22, ${glassOpacity})`,
      "--modal-header-bg": `rgba(22, 22, 26, ${Math.min(0.96, glassOpacity + 0.1)})`,
      "--sidebar-bg": "rgba(0, 0, 0, 0.25)",
      "--modal-border": "rgba(255, 255, 255, 0.1)",
      "--modal-text": "#ffffff",
      "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
      "--modal-title-color": "#ffffff",
      "--dropdown-text": "#ffffff",
      "--dropdown-bg": "rgba(30, 30, 36, 0.98)",
      "--dropdown-border": "rgba(255, 255, 255, 0.16)",
      "--stepper-text": "#ffffff",
      "--stepper-bg": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-border": "rgba(255, 255, 255, 0.1)",
      "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
      "--btn-neutral-color": "rgba(255, 255, 255, 0.75)",
      "--palette-primary": "#1ed760",
      "--palette-primary-rgb": "30, 215, 96",
      "--palette-contrast": "#000000",
      "--palette-glow": "rgba(30, 215, 96, 0.4)",
    } as React.CSSProperties;
  }, [isLightMode, isAutoTheme, previewPalette, settings.modalGlassBlur, settings.modalGlassOpacity]);

  if (!isOpen) return null;

  const themeItems: { value: ThemeOption; desc: string; icon: GruvboxIconName }[] = [
    { value: "Auto (Album Art)", desc: "Adaptive theme that matches the song's cover palette", icon: "palette" },
    { value: "Dark", desc: "Classic deep Apple Music dark appearance", icon: "moon" },
    { value: "Light", desc: "Clean Apple Music light appearance with dark type", icon: "sun" },
  ];

  const backgroundItems: { value: BackgroundOption; desc: string; icon: GruvboxIconName }[] = [
    { value: "Isolation (Beta)", desc: "Spotlight vignette on cover", icon: "focus" },
    { value: "Dynamic", desc: "Smooth ambient drifting motion", icon: "waves" },
    { value: "Dynamic (Beating)", desc: "Pulsing ambient glow with beat", icon: "heart" },
    { value: "3D Fluid Aurora", desc: "Drifting multi-color fluid aurora mesh", icon: "magic" },
    { value: "Apple Music", desc: "Vibrant saturated multi-color fluid blur", icon: "palette" },
    { value: "Static", desc: "Classic dimmed artwork backdrop", icon: "image" },
  ];

  const paletteItems: { value: PaletteAlgorithmOption; desc: string }[] = [
    { value: "Auto (Beta)", desc: "Intelligent adaptive color picking" },
    { value: "KMeans", desc: "Clustering-based dominant colors" },
    { value: "OctTree", desc: "Octree hierarchical color quantizing" },
    { value: "MedianCut (Preset 1)", desc: "Vibrant median cut tones" },
    { value: "MedianCut (Preset 2)", desc: "Deep balanced median cut tones" },
  ];

  const fontItems: { value: FontPresetOption; desc: string; fontFamily: string }[] = [
    {
      value: "Editorial Serif",
      desc: "Apple TV & Espresso editorial serif (Playfair / New York / Georgia)",
      fontFamily: '"New York", "Playfair Display", "Georgia", serif',
    },
    {
      value: "Spotify Circular",
      desc: "Spotify Circular geometric sans",
      fontFamily: '"CircularStd", "Circular", -apple-system, sans-serif',
    },
    {
      value: "Spotify Mix",
      desc: "Spotify Mix modern dynamic grotesque",
      fontFamily: '"SpotifyMix", -apple-system, sans-serif',
    },
    {
      value: "SF Pro Display",
      desc: "Apple SF Pro Display clean modern sans",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    },
    {
      value: "Rounded Bubble",
      desc: "SF Pro Rounded friendly bubble grotesque",
      fontFamily: '"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif',
    },
    {
      value: "Default",
      desc: "Default System UI typography",
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    },
    {
      value: "Custom",
      desc: "Monospace coding aesthetic",
      fontFamily: 'Consolas, Monaco, monospace',
    },
  ];

  const lyricMovementItems: { value: LyricMovementOption; desc: string }[] = [
    { value: "Apple TV Kinetic (Default)", desc: "Smooth rising kinetic pop & breathing float (Reference Style)" },
    { value: "Cinematic Center Snap", desc: "Dead-center camera lock with smooth deceleration roll" },
    { value: "Floating Wave Drift", desc: "Sinusoidal continuous multi-axis ambient drift" },
    { value: "Elastic Spring Pop", desc: "Energetic iOS 26 rubber-band spring pop" },
    { value: "Smooth Fade & Glide", desc: "Silky 600ms teleprompter cubic crossfade" },
    { value: "Subtle Classic", desc: "Static clean Apple Music typography without floating" },
  ];

  const lyricColorScopeItems: { value: LyricColorScopeOption; desc: string }[] = [
    { value: "Per-Song Adaptive", desc: "Adapts automatically to each song's cover art (M3 Engine)" },
    { value: "Standard Across All Songs", desc: "Forces chosen color or Rainbow across every track" },
    { value: "Per-Song Pinned", desc: "Pins custom color to specific individual songs" },
  ];

  const floatItems: { value: FloatAnimationOption; desc: string }[] = [
    { value: "High (Default)", desc: "Dynamic 5px floating lyric movement" },
    { value: "Medium", desc: "Subtle 3px smooth float" },
    { value: "Low", desc: "Gentle 1.5px micro float" },
    { value: "Off", desc: "Static text without floating movement" },
  ];

  const pullingItems: { value: PullingEffectOption; desc: string }[] = [
    { value: "Medium (Default)", desc: "Balanced Apple Music scroll elasticity" },
    { value: "Low", desc: "Gentle resistance pull" },
    { value: "Regular", desc: "Standard iOS spring pull" },
    { value: "High", desc: "Strong springy bounce" },
    { value: "Tremendous", desc: "Maximum rubber-band physics" },
    { value: "Disabled", desc: "Rigid boundaries without bounce" },
  ];

  const stylePresetItems: { value: StylePresetOption; desc: string }[] = [
    { value: "iOS 26.0", desc: "Modern iOS 26 refined Apple Music typography" },
    { value: "iOS 26.4 and later", desc: "Futuristic rounded fluid geometry" },
    { value: "iOS 17.1", desc: "Standard iOS 17 Apple Music layout" },
    { value: "iOS 16.4", desc: "iOS 16 compact lyric spacing" },
    { value: "iOS 16.3", desc: "iOS 16.3 legacy layout" },
    { value: "iOS 16.2", desc: "iOS 16.2 legacy layout" },
    { value: "iOS 15", desc: "iOS 15 legacy classic layout" },
    { value: "Android (New)", desc: "Material Design 3 expressive type" },
    { value: "Android (Old)", desc: "Material Design legacy style" },
    { value: "Custom", desc: "User custom parameters" },
  ];

  const lyricEasingItems: { value: LyricEasingOption; desc: string }[] = [
    { value: "Cubic-Bezier (Smooth)", desc: "Material Design & iOS smooth cubic acceleration" },
    { value: "Ease-In-Out", desc: "Balanced acceleration and deceleration curve" },
    { value: "Expressive Spring", desc: "Elastic spring-style bouncy lyric wipe" },
    { value: "Linear", desc: "Constant linear transition rate" },
  ];

  const lyricSpeedItems: { value: LyricSpeedOption; desc: string }[] = [
    { value: "Normal (1.0x)", desc: "100% natural synchronized speed" },
    { value: "Fast (1.2x)", desc: "20% accelerated lyric sweep" },
    { value: "Relaxed (0.8x)", desc: "20% slower relaxed lyric sweep" },
    { value: "Dynamic Track Speed", desc: "Adapts automatically to track tempo" },
  ];

  const lyricGradientItems: { value: LyricGradientOption; desc: string }[] = [
    { value: "Album Accent Gradient", desc: "Adaptive tonal highlight matching cover art (Primary M3)" },
    { value: "Album Vibrant Multi-Hue", desc: "3-color dynamic spectrum uniquely extracted from this album's artwork" },
    { value: "Album Warm Harmony", desc: "Dual warm & complementary hues directly paired from the album cover" },
    { value: "Album Deep Contrast", desc: "Striking high-contrast secondary & tertiary palette from the album" },
    { value: "Rainbow Spectrum (Animated)", desc: "Continuous animated chromatic rainbow light stream" },
    { value: "White Pure Glow", desc: "Classic crystalline Apple Music white luminescence" },
    { value: "Espresso Amber & Gold", desc: "Warm Sabrina Carpenter golden honey glow" },
    { value: "Sunset Coral & Peach", desc: "Vibrant radiant sunset coral & warm peach" },
    { value: "Vibrant Neon", desc: "Electric cyan, sky blue, and violet neon glow" },
    { value: "Emerald Aurora", desc: "Lush mint emerald and teal aurora rays" },
    { value: "Royal Amethyst", desc: "Deep luxury amethyst violet and magenta" },
    { value: "Rose Quartz", desc: "Soft luxury blush pink luminescence" },
    { value: "Custom Color", desc: "Personalized custom hex color selection" },
  ];

  const hqQualityItems: { label: string; value: HqQualityOption }[] = [
  { label: "Standard (128k MP3/AAC)", value: "Standard (128k)" },
  { label: "High (320k MP3)", value: "High (320k)" },
  { label: "Lossless (FLAC) (self-hosted only)", value: "Lossless (FLAC)" },
  { label: "Hi-Res (24-bit FLAC) (self-hosted only)", value: "Hi-Res (24-bit FLAC)" },
];
const spectrumStyleItems: { value: SpectrumStyleOption; desc: string }[] = [
    { value: "Bars (Classic)", desc: "36 rounded audio frequency bars with top glow caps" },
    { value: "Waveform (Fluid)", desc: "Continuous undulating harmonic spline wave" },
    { value: "Ambient Pulse", desc: "Rhythmic concentric radiant pulse rings" },
  ];

  const vinylStyleItems: { value: VinylStyleOption; desc: string }[] = [
    { value: "Turntable Deck", desc: "Hi-Fi turntable platter with power LED and tonearm" },
    { value: "Sleeve Slide-Out", desc: "Album jacket sleeve with vinyl disc sliding out when playing" },
  ];

  const waveformStyleItems: { value: WaveformStyleOption; desc: string }[] = [
    { value: "Squiggly Wave", desc: "Organic wobbly hand-drawn animated waveform" },
    { value: "Fluid Sine Wave", desc: "Continuous harmonic undulating sine wave" },
  ];

  // Compute live preview variables
  const levelPx =
    settings.blurLevel === 1
      ? 2.5
      : settings.blurLevel === 2
      ? 4.0
      : settings.blurLevel === 3
      ? 6.0
      : settings.blurLevel === 4
      ? 8.0
      : 11.0;

  const blurPx = settings.blurLyrics ? levelPx : 0;

  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    previewFont = '"Playfair Display", "Newsreader", "New York", Georgia, serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    previewFont = '"Plus Jakarta Sans", "CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    previewFont = '"Montserrat", "SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    previewFont = '"Nunito", "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    previewFont = '"JetBrains Mono", Consolas, Monaco, monospace';
  }

  // Float animation class for preview
  let previewFloatStyle: React.CSSProperties = {};
  if (settings.additionalAnimations && settings.karaokeMode) {
    if (settings.floatAnimation === "High (Default)") {
      previewFloatStyle = { animation: "lyricFloatHigh 3.2s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Medium") {
      previewFloatStyle = { animation: "lyricFloatMed 3.8s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Low") {
      previewFloatStyle = { animation: "lyricFloatLow 4.4s ease-in-out infinite" };
    }
  }

  // Background style for preview stage
  let previewAmbientStyle: React.CSSProperties = {
    backgroundImage: songImage
      ? `url("${songImage}")`
      : "linear-gradient(135deg, #1e3a8a, #701a75, #b91c1c)",
  };

  if (settings.background === "Dynamic") {
    previewAmbientStyle.animation = "ambientDrift 16s infinite ease-in-out";
  } else if (settings.background === "Dynamic (Beating)") {
    previewAmbientStyle.animation = "ambientPulse 2.2s infinite ease-in-out";
  } else if (settings.background === "3D Fluid Aurora") {
    previewAmbientStyle.filter = "blur(24px) saturate(2.6) brightness(0.6)";
    previewAmbientStyle.animation = "ambientDrift 10s infinite alternate ease-in-out";
  } else if (settings.background === "Apple Music") {
    previewAmbientStyle.filter = "blur(32px) saturate(2.4) brightness(0.52)";
    previewAmbientStyle.animation = "ambientDrift 14s infinite alternate ease-in-out";
  } else if (settings.background === "Isolation (Beta)") {
    previewAmbientStyle.filter = "blur(50px) saturate(0.8) brightness(0.18)";
    previewAmbientStyle.opacity = 0.3;
  } else if (settings.background === "Static") {
    previewAmbientStyle.filter = "blur(35px) saturate(1.1) brightness(0.28)";
  }

  // Style preset size and scale for preview
  let previewScale = 1.03;
  let previewActiveSize = "20px";
  if (settings.stylePreset === "iOS 26.4 and later") {
    previewScale = 1.06;
    previewActiveSize = "22px";
  } else if (settings.stylePreset === "iOS 17.1") {
    previewScale = 1.02;
    previewActiveSize = "19px";
  } else if (settings.stylePreset === "iOS 16.4" || settings.stylePreset === "iOS 16.3" || settings.stylePreset === "iOS 16.2") {
    previewScale = 1.01;
    previewActiveSize = "18px";
  } else if (settings.stylePreset === "iOS 15") {
    previewScale = 1.0;
    previewActiveSize = "16px";
  } else if (settings.stylePreset.startsWith("Android")) {
    previewScale = 1.02;
    previewActiveSize = "18px";
  }

  

  let previewLyricActiveColor = isLightMode ? "#111113" : "#ffffff";
  if (settings.lyricGradient === "Rainbow Spectrum (Animated)") {
    previewLyricActiveColor = "#ff2a5f";
  } else if (settings.lyricGradient === "Album Accent Gradient" && previewPalette?.primary) {
    previewLyricActiveColor = previewPalette.primary;
  } else if (settings.lyricGradient === "Album Vibrant Multi-Hue" && previewPalette) {
    const p1 = previewPalette.primary;
    const p2 = previewPalette.secondary;
    const p3 = previewPalette.tertiary || p1;
    previewLyricActiveColor = `linear-gradient(90deg, ${p1} 0%, ${p2} 50%, ${p3} 100%)`;
  } else if (settings.lyricGradient === "Album Warm Harmony" && previewPalette) {
    const p1 = previewPalette.primary;
    const p2 = previewPalette.tertiary || previewPalette.secondary;
    previewLyricActiveColor = `linear-gradient(90deg, ${p1} 0%, ${p2} 100%)`;
  } else if (settings.lyricGradient === "Album Deep Contrast" && previewPalette) {
    const p1 = previewPalette.primary;
    const p4 = previewPalette.quaternary || previewPalette.secondary;
    previewLyricActiveColor = `linear-gradient(90deg, ${p1} 0%, ${p4} 100%)`;
  } else if (settings.lyricGradient === "Espresso Amber & Gold") {
    previewLyricActiveColor = "#f59e0b";
  } else if (settings.lyricGradient === "Sunset Coral & Peach") {
    previewLyricActiveColor = "#ff6b6b";
  } else if (settings.lyricGradient === "Vibrant Neon") {
    previewLyricActiveColor = "#00f2fe";
  } else if (settings.lyricGradient === "Emerald Aurora") {
    previewLyricActiveColor = "#10b981";
  } else if (settings.lyricGradient === "Royal Amethyst") {
    previewLyricActiveColor = "#a855f7";
  } else if (settings.lyricGradient === "Rose Quartz") {
    previewLyricActiveColor = "#fb7185";
  } else if (settings.lyricGradient === "Custom Color") {
    previewLyricActiveColor = settings.customLyricColor || "#f59e0b";
  }

  const previewInactiveColor = isLightMode
    ? "rgba(20, 20, 24, 0.35)"
    : "rgba(255, 255, 255, 0.4)";
  const previewActiveGradient = isLightMode
    ? `linear-gradient(to right, ${previewLyricActiveColor} 0%, ${previewLyricActiveColor} 55%, rgba(20, 20, 24, 0.35) 55%, rgba(20, 20, 24, 0.35) 100%)`
    : `linear-gradient(to right, ${previewLyricActiveColor} 0%, ${previewLyricActiveColor} 55%, rgba(255, 255, 255, 0.4) 55%, rgba(255, 255, 255, 0.4) 100%)`;
  const previewOverlayBg = isLightMode
    ? "radial-gradient(circle at 35% 50%, rgba(245, 245, 250, 0.72) 0%, rgba(228, 230, 238, 0.90) 100%)"
    : previewPalette?.overlayGradient || undefined;

  

  return (
    <div
      className={`${styles.modalOverlay} ${
        viewMode === "docked" ? styles.overlayDocked : ""
      }`}
      onClick={viewMode === "docked" ? undefined : onClose}
    >
      <div
        className={`${styles.modalWindow} ${
          viewMode === "split"
            ? styles.windowSplit
            : viewMode === "docked"
            ? styles.windowDocked
            : styles.windowCentered
        } ${isLightMode ? styles.modalLight : isAutoTheme ? styles.modalAuto : styles.modalDark}`}
        style={modalThemeVars}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Nocturne Settings"
      >
        {/* Header - Clean Riff Minimalist Bar */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <h1 className={styles.modalTitle}>
              <span>Settings</span>
              <span className={styles.studioHeaderBadge}>Nocturne v4.2</span>
            </h1>
          </div>

          <div className={styles.headerControls}>
            {/* View Mode Switcher Capsule */}
            <div className={styles.viewModeSwitcher} role="group" aria-label="Layout View Modes">
              <button
                type="button"
                className={`${styles.viewModeBtn} ${
                  viewMode === "split" ? styles.viewModeActive : ""
                }`}
                onClick={() => setViewMode("split")}
                title="Split: 3-pane live preview and settings"
              >
                <GruvboxIcon name="split" size={13} />
                <span>Split</span>
              </button>

              <button
                type="button"
                className={`${styles.viewModeBtn} ${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }`}
                onClick={() => setViewMode("docked")}
                title="Dock: Pinned compact side drawer"
              >
                <GruvboxIcon name="dock" size={13} />
                <span>Dock</span>
              </button>

              <button
                type="button"
                className={`${styles.viewModeBtn} ${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }`}
                onClick={() => setViewMode("centered")}
                title="Window: Centered floating dialog"
              >
                <GruvboxIcon name="dialog" size={13} />
                <span>Window</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode only) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={`${styles.previewToggleBtn} ${settings.showLivePreview === false ? styles.previewToggleOff : ""}`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showLivePreview: prev.showLivePreview === false ? true : false,
                  }))
                }
                title={settings.showLivePreview !== false ? "Hide Live Preview (Full Width Settings)" : "Show Live Preview"}
              >
                <GruvboxIcon name="image" size={12} />
                <span>{settings.showLivePreview !== false ? "Hide Preview" : "Show Preview"}</span>
              </button>
            )}

            <div className={styles.headerDivider} />

            {/* Quit Application Button */}
            <button
              type="button"
              className={styles.appCloseBtn}
              onClick={handleQuitApp}
              title="Exit and close application"
              aria-label="Close Application"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
              <span>Quit App</span>
            </button>

            {/* Close Settings Modal Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close Settings"
            >
              <GruvboxIcon name="close" size={12} />
            </button>
          </div>
        </div>

        {/* Split Content Container (Riff 3-Pane Architecture) */}
        <div className={styles.splitContentContainer}>
          {/* 1. LEFT: Riff-Inspired Category Navigation Sidebar */}
          <aside className={styles.riffSidebar}>
            <div className={styles.riffSearchBox}>
              <GruvboxIcon name="search" size={13} />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.riffSearchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={styles.searchClearBtn}
                  aria-label="Clear search"
                >
                  <GruvboxIcon name="close" size={10} />
                </button>
              )}
            </div>

            <nav className={styles.riffCategoryList} aria-label="Settings Categories">
              {sidebarCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.riffCategoryItem} ${
                    activeCategory === cat.id && !searchQuery ? styles.riffCategoryItemActive : ""
                  }`}
                  onClick={() => {
                    handleCategoryChange(cat.id);
                    setSearchQuery("");
                  }}
                >
                  <span className={styles.riffCategoryIcon}>
                    <GruvboxIcon name={cat.icon} size={14} />
                  </span>
                  <span className={styles.riffCategoryLabel}>{cat.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* 2. CENTER: Settings Content Body */}
          <div className={styles.settingsPane}>
            <div ref={modalBodyRef} className={styles.modalBody}>
              {/* If in centered mode, show compact preview at top */}
              {viewMode === "centered" && settings.showLivePreview !== false && (
                <div className={styles.previewContainer}>
                  <div className={styles.previewHeader}>
                    <span className={styles.previewTag}>LIVE PREVIEW</span>
                    <span className={styles.previewMeta}>
                      {settings.theme || "Auto (Album Art)"} • {settings.stylePreset} • {settings.fontPreset} • {settings.background}
                    </span>
                  </div>

                  <div className={styles.previewStage}>
                    <div
                      className={styles.previewAmbient}
                      style={previewAmbientStyle}
                    />
                    <div
                      className={styles.previewOverlay}
                      style={{
                        background: previewOverlayBg,
                      }}
                    />

                    <div
                      className={styles.previewLyricWrapper}
                      style={{
                        alignItems: settings.rightAlignFirst ? "flex-end" : "center",
                        textAlign: settings.rightAlignFirst ? "right" : "center",
                      }}
                    >
                      <p
                        className={styles.previewInactiveLine}
                        style={{
                          filter: `blur(${blurPx}px)`,
                          fontFamily: previewFont,
                          fontWeight: settings.boldText ? 800 : 600,
                          color: previewInactiveColor,
                        }}
                      >
                        {linePrev}
                      </p>

                      <p
                        className={`${styles.previewActiveLine} ${
                          settings.wordShine ? styles.previewWordShine : ""
                        }`}
                        style={{
                          fontFamily: previewFont,
                          fontWeight: settings.boldText ? 900 : 750,
                          fontSize: previewActiveSize,
                          transform: `scale(${previewScale})`,
                          background: previewActiveGradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow:
                            !isLightMode && previewPalette?.glow
                              ? `0 0 16px ${previewPalette.glow}`
                              : undefined,
                          ...previewFloatStyle,
                        }}
                      >
                        {lineActive}
                      </p>

                      <p
                        className={styles.previewInactiveLine}
                        style={{
                          filter: `blur(${blurPx}px)`,
                          fontFamily: previewFont,
                          fontWeight: settings.boldText ? 800 : 600,
                          color: previewInactiveColor,
                        }}
                      >
                        {lineNext}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "appearance") && (
            <>
              <div id="sec-appearance" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="palette" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Appearance & Themes</span>
                <div className={styles.sectionHeaderLine} />
              </div>
              {/* 0. Theme */}
                    {/* Modal Glass Blur Slider */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <GruvboxIcon name="waves" size={18} />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Modal Glass Blur</h3>
                <span className={styles.settingDesc}>
                  Frosted glass backdrop blur intensity of the settings box
                </span>
              </div>
            </div>

            <div className={styles.sliderControlCol}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.max(0, (prev.modalGlassBlur ?? 28) - 4),
                    }))
                  }
                  title="Decrease Blur (-4px)"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={settings.modalGlassBlur ?? 28}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          modalGlassBlur: val,
                        }));
                      }
                    }}
                    onInput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          modalGlassBlur: val,
                        }));
                      }
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: `linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) ${Math.max(0, Math.min(100, ((settings.modalGlassBlur ?? 28) / 60) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} ${Math.max(0, Math.min(100, ((settings.modalGlassBlur ?? 28) / 60) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)`,
                    }}
                    title={`Modal Glass Blur: ${settings.modalGlassBlur ?? 28}px`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) >= 60}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.min(60, (prev.modalGlassBlur ?? 28) + 4),
                    }))
                  }
                  title="Increase Blur (+4px)"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassBlur ?? 28}px
                </span>
              </div>
            </div>
          </div>

          {/* Modal Window Opacity Slider */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <GruvboxIcon name="palette" size={18} />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Interface Opacity</h3>
                <span className={styles.settingDesc}>
                  Adjust UI surface translucency (0% for pure transparent glass, 100% for solid surface)
                </span>
              </div>
            </div>

            <div className={styles.sliderControlCol}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.max(0, (prev.modalGlassOpacity ?? 75) - 5),
                    }))
                  }
                  title="More Transparent (-5%)"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.modalGlassOpacity ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          modalGlassOpacity: val,
                        }));
                      }
                    }}
                    onInput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          modalGlassOpacity: val,
                        }));
                      }
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: `linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) ${Math.max(0, Math.min(100, settings.modalGlassOpacity ?? 75))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} ${Math.max(0, Math.min(100, settings.modalGlassOpacity ?? 75))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)`,
                    }}
                    title={`Modal Window Opacity: ${settings.modalGlassOpacity ?? 75}%`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) >= 100}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.min(100, (prev.modalGlassOpacity ?? 75) + 5),
                    }))
                  }
                  title="More Opaque (+5%)"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassOpacity ?? 75}%
                </span>
              </div>
            </div>
          </div>

<div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Theme</h3>
                <span className={styles.settingDesc}>
                  Select Dark Mode, Light Mode, or Auto (matches album palette)
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "theme" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("theme", e)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <GruvboxIcon
                    name={
                      settings.theme === "Dark"
                        ? "moon"
                        : settings.theme === "Light"
                        ? "sun"
                        : "palette"
                    }
                    size={14}
                  />
                  {settings.theme || "Auto (Album Art)"}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "theme" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "260px" }}
                >
                  {themeItems.map((item) => {
                    const isSelected = (settings.theme || "Auto (Album Art)") === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            theme: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                            <GruvboxIcon name={item.icon} size={15} />
                            {item.value}
                          </span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 1. Background */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                  <path d="m5 2 5 5" />
                  <path d="M2 13h15" />
                  <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.6 2-4 .3 1.4 2 2.4 2 4Z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Background</h3>
                <span className={styles.settingDesc}>
                  Choose the background you want to use in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "background" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("background", e)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <GruvboxIcon
                    name={
                      settings.background === "Isolation (Beta)"
                        ? "focus"
                        : settings.background === "Dynamic"
                        ? "waves"
                        : settings.background === "Dynamic (Beating)"
                        ? "heart"
                        : settings.background === "3D Fluid Aurora"
                        ? "magic"
                        : settings.background === "Apple Music"
                        ? "palette"
                        : "image"
                    }
                    size={14}
                  />
                  {settings.background}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "background" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "260px" }}
                >
                  {backgroundItems.map((item) => {
                    const isSelected = settings.background === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            background: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                            <GruvboxIcon name={item.icon} size={15} />
                            {item.value}
                          </span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 2. Palette algorithm */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <line x1="8" x2="16" y1="6" y2="6" />
                  <path d="M16 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M8 10h.01" />
                  <path d="M16 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M8 14h.01" />
                  <path d="M16 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M8 18h.01" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Palette algorithm</h3>
                <span className={styles.settingDesc}>
                  Select a color picking algorithm
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "palette" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("palette", e)}
              >
                <span>{settings.paletteAlgorithm}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "palette" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "250px" }}
                >
                  {paletteItems.map((item) => {
                    const isSelected = settings.paletteAlgorithm === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            paletteAlgorithm: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 16. Style preset */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="2" width="13" height="15" rx="2" />
                  <path d="M4 7v13a2 2 0 0 0 2 2h11" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Style preset</h3>
                <span className={styles.settingDesc}>
                  Details are different in different system versions
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "stylePreset" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("stylePreset", e)}
              >
                <span>{settings.stylePreset}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "stylePreset" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "270px" }}
                >
                  {stylePresetItems.map((item) => {
                    const isSelected = settings.stylePreset === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            stylePreset: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 7. Font preset */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h3m5 0h3m-5-8h4m-7-6 4 14m0-14 4 14" />
                  <path d="M17 14h4m-3-4 2 8m0-8 2 8" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Font preset</h3>
                <span className={styles.settingDesc}>
                  Use font presets in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "font" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("font", e)}
              >
                <span>{settings.fontPreset}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "font" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "260px" }}
                >
                  {fontItems.map((item) => {
                    const isSelected = settings.fontPreset === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            fontPreset: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontFamily: item.fontFamily,
                            fontSize: "14px",
                          }}
                        >
                          {item.value}
                        </span>
                        <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </div>
          </div>
              {/* 6. Bold Text */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                  <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Bold Text</h3>
                <span className={styles.settingDesc}>
                  Use bold text in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.boldText ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    boldText: !prev.boldText,
                  }))
                }
                aria-label="Toggle bold text"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
            </>
          )}

          {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "lyrics") && (
            <>
              <div id="sec-lyrics" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="chat" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Lyrics & Typography</span>
                <div className={styles.sectionHeaderLine} />
              </div>
              {/* 3. Blur lyrics */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20" />
                  <path d="M16 4.5v15" />
                  <path d="M20 8v8" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Blur lyrics</h3>
                <span className={styles.settingDesc}>
                  Enable blur effect on lyrics
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.blurLyrics ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    blurLyrics: !prev.blurLyrics,
                  }))
                }
                aria-label="Toggle blur lyrics"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 4. REDESIGNED BLUR LEVEL CONTROL: Full-Width Card with Zero Overflow */}
          <div
            className={`${styles.settingRow} ${styles.settingCardRow}`}
            style={{
              opacity: settings.blurLyrics ? 1 : 0.45,
              pointerEvents: settings.blurLyrics ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Header: Title, Description & Live Preview Swatch */}
            <div className={styles.settingCardHeader}>
              <div className={styles.leftCol}>
                <div className={styles.iconWrapper}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                </div>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Blur level</h3>
                  <span className={styles.settingDesc}>
                    Select blur intensity (Level 1: 2.5px to Level 5: 11.0px)
                  </span>
                </div>
              </div>

              <div className={styles.settingCardBadge}>
                <div
                  className={styles.blurPreviewSwatch}
                  style={{
                    filter: `blur(${blurPx}px)`,
                  }}
                  title={`Live blur preview: ${levelPx.toFixed(1)}px`}
                >
                  {settings.blurLyrics ? `Sample (${levelPx.toFixed(1)}px)` : "Blur Off"}
                </div>
              </div>
            </div>

            {/* Body: Responsive Full-Width Segmented Controls & Slider */}
            <div className={styles.blurControlsBody}>
              {/* Segmented Level Buttons L1 - L5 */}
              <div className={styles.segmentedSelector}>
                {[
                  { lvl: 1, label: "L1", px: "2.5px" },
                  { lvl: 2, label: "L2", px: "4.0px" },
                  { lvl: 3, label: "L3", px: "6.0px" },
                  { lvl: 4, label: "L4", px: "8.0px" },
                  { lvl: 5, label: "L5", px: "11.0px" },
                ].map(({ lvl, label, px }) => (
                  <button
                    key={lvl}
                    className={`${styles.segmentBtn} ${
                      settings.blurLevel === lvl ? styles.segmentActive : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        blurLevel: lvl,
                      }))
                    }
                    title={`Set Blur Level ${lvl} (${px})`}
                  >
                    <span className={styles.segmentLabel}>{label}</span>
                    <span className={styles.segmentSub}>{px}</span>
                  </button>
                ))}
              </div>

              {/* Slider & Precision Stepper Row */}
              <div className={styles.blurSliderStepperRow}>
                <button
                  className={styles.stepperBtn}
                  disabled={settings.blurLevel <= 1}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      blurLevel: Math.max(1, prev.blurLevel - 1),
                    }))
                  }
                  title="Decrease Blur Level"
                  aria-label="Decrease Blur Level"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={settings.blurLevel}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          blurLevel: val,
                        }));
                      }
                    }}
                    onInput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!isNaN(val)) {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          blurLevel: val,
                        }));
                      }
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: `linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) ${Math.max(0, Math.min(100, ((settings.blurLevel - 1) / 4) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} ${Math.max(0, Math.min(100, ((settings.blurLevel - 1) / 4) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)`,
                    }}
                    title={`Blur Slider: Level ${settings.blurLevel} (${levelPx.toFixed(1)}px)`}
                  />
                </div>

                <button
                  className={styles.stepperBtn}
                  disabled={settings.blurLevel >= 5}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      blurLevel: Math.min(5, prev.blurLevel + 1),
                    }))
                  }
                  title="Increase Blur Level"
                  aria-label="Increase Blur Level"
                >
                  +
                </button>

                <span className={styles.blurValueBadge}>
                  {levelPx.toFixed(1)}px
                </span>
              </div>
            </div>
          </div>
              {/* 5. Auto unblur */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="14" x="3" y="3" rx="2" />
                  <path d="m14 11-3 3-1.5-1.5" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Auto unblur</h3>
                <span className={styles.settingDesc}>
                  Temporarily disable blur effect on mouseover
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.autoUnblur ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    autoUnblur: !prev.autoUnblur,
                  }))
                }
                aria-label="Toggle auto unblur"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 8. Karaoke mode (Master Toggle & Accordion Header) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Karaoke mode</h3>
                <span className={styles.settingDesc}>
                  Yes, now you can have karaoke style lyrics in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.karaokeMode ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    karaokeMode: !prev.karaokeMode,
                  }))
                }
                aria-label="Toggle karaoke mode"
              >
                <div className={styles.toggleThumb} />
              </button>

              <button
                className={styles.expandButton}
                onClick={() => setKaraokeExpanded((cur) => !cur)}
                title={karaokeExpanded ? "Collapse" : "Expand"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    transform: karaokeExpanded
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Karaoke Sub-Options */}
          {karaokeExpanded && settings.karaokeMode && (
            <>
              {/* Sub 1: Disable karaoke style for CJK lyrics */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                    </svg>
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>
                      Disable karaoke style for CJK lyrics
                    </h3>
                    <span className={styles.settingDesc}>
                      CJK karaoke lyrics uses more resources to display, disable might improve the animation performance
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.toggleSwitch} ${
                      settings.disableCJKKaraoke ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        disableCJKKaraoke: !prev.disableCJKKaraoke,
                      }))
                    }
                    aria-label="Toggle disable CJK karaoke"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>

              {/* Sub 2: Enable additional animations */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect width="20" height="5" x="2" y="7" />
                      <line x1="12" x2="12" y1="22" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>
                      Enable additional animations
                    </h3>
                    <span className={styles.settingDesc}>
                      Better animation, better experience
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.toggleSwitch} ${
                      settings.additionalAnimations ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        additionalAnimations: !prev.additionalAnimations,
                      }))
                    }
                    aria-label="Toggle additional animations"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>

              {/* Sub 3: Float animation */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                      <polyline points="8 9 12 5 16 9" />
                      <line x1="12" x2="12" y1="5" y2="17" />
                    </svg>
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Float animation</h3>
                    <span className={styles.settingDesc}>
                      Lyrics playing, syllables floating, so amazing
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.dropdownButton} ${openDropdown === "float" ? styles.dropdownButtonActive : ""}`}
                    onClick={(e) => toggleDropdown("float", e)}
                  >
                    <span>{settings.floatAnimation}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {openDropdown === "float" && (
                    <div
                      className={`${styles.dropdownPopover} ${
                        dropdownDropUp ? styles.dropdownDropUp : ""
                      }`}
                      style={{ minWidth: "260px" }}
                    >
                      {floatItems.map((item) => {
                        const isSelected = settings.floatAnimation === item.value;
                        return (
                          <button
                            key={item.value}
                            className={`${styles.dropdownItem} ${
                              isSelected ? styles.dropdownItemSelected : ""
                            }`}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                floatAnimation: item.value,
                              }));
                              setOpenDropdown(null);
                            }}
                          >
                            {isSelected ? (
                              <div className={styles.selectedBar} />
                            ) : (
                              <div className={styles.emptyBar} />
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: 600 }}>{item.value}</span>
                              <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub 4: Word shining effect */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Word shining effect</h3>
                    <span className={styles.settingDesc}>
                      That&apos;s glorious
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.toggleSwitch} ${
                      settings.wordShine ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        wordShine: !prev.wordShine,
                      }))
                    }
                    aria-label="Toggle word shining effect"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>

              {/* Sub 5: Enable CJK word shining effect */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                    </svg>
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>
                      Enable CJK word shining effect
                    </h3>
                    <span className={styles.settingDesc}>
                      Enable word shining effect for multiple CJK characters
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.toggleSwitch} ${
                      settings.cjkWordShine ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        cjkWordShine: !prev.cjkWordShine,
                      }))
                    }
                    aria-label="Toggle CJK word shine"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>

              {/* Sub 6: Syllable & Terminal Word Magnification */}
              <div className={`${styles.settingRow} ${styles.nested}`}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <GruvboxIcon name="split" size={18} />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>
                      Syllable Magnification (Glow Pop)
                    </h3>
                    <span className={styles.settingDesc}>
                      Magnifies and elevates words dynamically as the singing sweep passes over them, with an expressive bloom on end-of-sentence words
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.toggleSwitch} ${
                      settings.syllableMagnify !== false ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        syllableMagnify: prev.syllableMagnify === false ? true : false,
                      }))
                    }
                    aria-label="Toggle syllable magnification"
                  >
                    <div className={styles.toggleThumb} />
                  </button>
                </div>
              </div>
            </>
          )}
              {/* 9. Duet view */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Duet view</h3>
                <span className={styles.settingDesc}>
                  Multiple vocalists show on opposite sides of the screen to make duets or multi-singer tracks easy to sing along to
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.duetView ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    duetView: !prev.duetView,
                  }))
                }
                aria-label="Toggle duet view"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 10. Right alignment first */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" x2="3" y1="6" y2="6" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                  <line x1="21" x2="7" y1="18" y2="18" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Right alignment first</h3>
                <span className={styles.settingDesc}>
                  Align lyrics to the right first
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.rightAlignFirst ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    rightAlignFirst: !prev.rightAlignFirst,
                  }))
                }
                aria-label="Toggle right alignment"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 20. Lyric Animation Curve */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 20c4-12 8-12 18-16" />
                  <circle cx="3" cy="20" r="2" />
                  <circle cx="21" cy="4" r="2" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Animation Curve</h3>
                <span className={styles.settingDesc}>
                  Easing dynamic used when highlighting and wiping karaoke lyrics
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "lyricEasing" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("lyricEasing", e)}
              >
                <span>{settings.lyricEasing}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricEasing" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "280px" }}
                >
                  {lyricEasingItems.map((item) => {
                    const isSelected = settings.lyricEasing === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricEasing: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 21. Lyric Animation Speed */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Animation Speed</h3>
                <span className={styles.settingDesc}>
                  Control the playback sweep tempo and lyric wipe speed
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "lyricSpeed" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("lyricSpeed", e)}
              >
                <span>{settings.lyricSpeed}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricSpeed" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "260px" }}
                >
                  {lyricSpeedItems.map((item) => {
                    const isSelected = settings.lyricSpeed === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricSpeed: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 22. Lyric Movement & Transition Style */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Movement & Motion Physics</h3>
                <span className={styles.settingDesc}>
                  Transition style when lines advance: Apple TV Kinetic (Reference), Cinematic Snap, Wave Drift, Spring Pop
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "lyricMovement" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("lyricMovement", e)}
              >
                <span>{settings.lyricMovement || "Apple TV Kinetic (Default)"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricMovement" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "290px" }}
                >
                  {lyricMovementItems.map((item) => {
                    const isSelected = (settings.lyricMovement || "Apple TV Kinetic (Default)") === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricMovement: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 23. Lyric Color & Rainbow Highlight */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Color & Rainbow Highlight</h3>
                <span className={styles.settingDesc}>
                  Select singing lyric color: Animated Rainbow Spectrum, Espresso Amber, Album Adaptive, or Custom
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {settings.lyricGradient === "Custom Color" && (
                <input
                  type="color"
                  value={settings.customLyricColor || "#f59e0b"}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      customLyricColor: e.target.value,
                    }))
                  }
                  title="Choose custom lyric color"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid var(--btn-neutral-border, rgba(255,255,255,0.2))",
                    cursor: "pointer",
                    background: "transparent",
                    padding: "2px",
                  }}
                />
              )}

              <button
                className={`${styles.dropdownButton} ${openDropdown === "lyricGradient" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("lyricGradient", e)}
              >
                {settings.lyricGradient === "Rainbow Spectrum (Animated)" && (
                  <span style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "linear-gradient(90deg, #ff2a5f, #ffc83b, #06b6d4, #a855f7)",
                    marginRight: "4px"
                  }} />
                )}
                {settings.lyricGradient === "Album Vibrant Multi-Hue" && previewPalette && (
                  <span style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: `linear-gradient(90deg, ${previewPalette.primary}, ${previewPalette.secondary}, ${previewPalette.tertiary || previewPalette.primary})`,
                    marginRight: "4px"
                  }} />
                )}
                {settings.lyricGradient === "Album Warm Harmony" && previewPalette && (
                  <span style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: `linear-gradient(90deg, ${previewPalette.primary}, ${previewPalette.tertiary || previewPalette.secondary})`,
                    marginRight: "4px"
                  }} />
                )}
                {settings.lyricGradient === "Album Deep Contrast" && previewPalette && (
                  <span style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: `linear-gradient(90deg, ${previewPalette.primary}, ${previewPalette.quaternary || previewPalette.secondary})`,
                    marginRight: "4px"
                  }} />
                )}
                <span>{settings.lyricGradient}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricGradient" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "290px" }}
                >
                  {lyricGradientItems.map((item) => {
                    const isSelected = settings.lyricGradient === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricGradient: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 24. Color Application Scope (Standard Across All Songs vs Per-Song) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Color Application Scope</h3>
                <span className={styles.settingDesc}>
                  Apply color universally across all tracks, adapt dynamically per-song from album art, or pin custom color to current song
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "lyricColorScope" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("lyricColorScope", e)}
              >
                <span>{settings.lyricColorScope || "Per-Song Adaptive"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {song && (
                <button
                  type="button"
                  className={styles.headerActionPill}
                  style={{ height: "34px", fontSize: "11px", padding: "0 10px" }}
                  onClick={() => {
                    const songKey = song.name && song.artists ? `${song.name}-${song.artists}` : (song.name || "");
                    if (songKey) {
                      onUpdateSettings((prev) => ({
                        ...prev,
                        lyricColorScope: "Per-Song Pinned",
                        pinnedSongColors: {
                          ...(prev.pinnedSongColors || {}),
                          [songKey]: prev.lyricGradient,
                        },
                      }));
                    }
                  }}
                  title="Pin current color preset to this specific song"
                >
                  <GruvboxIcon name="heart" size={12} />
                  <span>Pin to Song</span>
                </button>
              )}

              {openDropdown === "lyricColorScope" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "280px" }}
                >
                  {lyricColorScopeItems.map((item) => {
                    const isSelected = (settings.lyricColorScope || "Per-Song Adaptive") === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricColorScope: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Line Scaling */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Dynamic Line Scaling</h3>
                <span className={styles.settingDesc}>
                  Automatically scale short punchy lines up and compact long verses for magazine-style typography
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.dynamicLineScaling ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    dynamicLineScaling: !prev.dynamicLineScaling,
                  }))
                }
                aria-label="Toggle dynamic line scaling"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Word Particle Sparkle */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Word Particle Sparkle</h3>
                <span className={styles.settingDesc}>
                  Dynamic syllable shimmer and glowing particle radiance sweeping across active singing words
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.particleSparkle ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    particleSparkle: !prev.particleSparkle,
                  }))
                }
                aria-label="Toggle word particle sparkle"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Sparkle Intensity Nested Slider */}
          {settings.particleSparkle && (
            <div className={`${styles.settingRow} ${styles.nested}`}>
              <div className={styles.leftCol}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Sparkle Intensity</h3>
                  <span className={styles.settingDesc}>
                    Adjust the bloom brilliance, glow radius, and shimmer radiance of active syllables
                  </span>
                </div>
              </div>
              <div className={styles.sliderControlCol}>
                <div className={styles.blurSliderStepperRow}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    disabled={(settings.particleSparkleIntensity ?? 65) <= 5}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        particleSparkleIntensity: Math.max(5, (prev.particleSparkleIntensity ?? 65) - 5),
                      }))
                    }
                    title="Decrease Sparkle Intensity (-5%)"
                    aria-label="Decrease Sparkle Intensity"
                  >
                    −
                  </button>
                  <div className={styles.sliderTrackWrapper}>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={settings.particleSparkleIntensity ?? 65}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            particleSparkleIntensity: val,
                          }));
                        }
                      }}
                      onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        if (!isNaN(val)) {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            particleSparkleIntensity: val,
                          }));
                        }
                      }}
                      className={styles.blurSmoothSlider}
                      style={{
                        background: `linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) ${Math.max(0, Math.min(100, settings.particleSparkleIntensity ?? 65))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} ${Math.max(0, Math.min(100, settings.particleSparkleIntensity ?? 65))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)`,
                      }}
                      title={`Sparkle Intensity: ${settings.particleSparkleIntensity ?? 65}%`}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    disabled={(settings.particleSparkleIntensity ?? 65) >= 100}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        particleSparkleIntensity: Math.min(100, (prev.particleSparkleIntensity ?? 65) + 5),
                      }))
                    }
                    title="Increase Sparkle Intensity (+5%)"
                    aria-label="Increase Sparkle Intensity"
                  >
                    +
                  </button>
                  <span className={styles.sliderValueBadge}>
                    {settings.particleSparkleIntensity ?? 65}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Karaoke Bouncing Indicator */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Karaoke Bouncing Indicator</h3>
                <span className={styles.settingDesc}>
                  Illuminated bouncing follower dot that leads the singing syllable across the active line
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.karaokeBouncingBall ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    karaokeBouncingBall: !prev.karaokeBouncingBall,
                  }))
                }
                aria-label="Toggle karaoke bouncing indicator"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Duet Vocalist Badges */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Duet Vocalist Badges</h3>
                <span className={styles.settingDesc}>
                  Show distinct Singer 1 / Singer 2 pill badges on multi-part lines when duet view is active
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.vocalistBadges ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    vocalistBadges: !prev.vocalistBadges,
                  }))
                }
                aria-label="Toggle duet vocalist badges"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
            </>
          )}

          {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "sources" || activeCategory === "lyrics") && (
            <>
              <div id="sec-sources" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="focus" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Lyric Sources & Karaoke Priority</span>
                <div className={styles.sectionHeaderLine} />
              </div>

              {/* General Lyrics Source Priority Ladder */}
              <div style={{ marginBottom: "10px", padding: "0 4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--palette-primary, #1ed760)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Lyrics Search Fallback Priority
                </span>
                <p style={{ fontSize: "12px", opacity: 0.65, margin: "4px 0 12px 0" }}>
                  Nocturne queries these sources in top-to-bottom order. Use arrows to change priority order or toggle individual sources on/off.
                </p>
              </div>

              {(settings.lyricSourcesPriority || DEFAULT_LYRIC_SOURCES_PRIORITY).map((sourceId, idx, arr) => {
                const def = ALL_LYRIC_SOURCES.find((s) => s.id === sourceId);
                if (!def) return null;
                const isEnabled = !(settings.disabledLyricSources || []).includes(sourceId);

                return (
                  <div key={sourceId} className={styles.settingRow} style={{ opacity: isEnabled ? 1 : 0.55, transition: "opacity 0.2s ease" }}>
                    <div className={styles.leftCol} style={{ gap: "14px" }}>
                      <span className={`${styles.sourceRankBadge} ${!isEnabled ? styles.dimmed : ""}`}>
                        #{idx + 1}
                      </span>
                      <div className={styles.textWrapper}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h3 className={styles.settingName}>{def.name}</h3>
                          <span className={styles.sourceCapabilityBadge}>
                            {def.badge}
                          </span>
                        </div>
                        <span className={styles.settingDesc}>{def.description}</span>
                      </div>
                    </div>

                    <div className={styles.rightCol} style={{ gap: "10px" }}>
                      <div className={styles.priorityButtonRow}>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveLyricSource(idx, "up")}
                          disabled={idx === 0}
                          title="Move up in priority"
                          aria-label={`Move ${def.name} up in priority`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveLyricSource(idx, "down")}
                          disabled={idx === arr.length - 1}
                          title="Move down in priority"
                          aria-label={`Move ${def.name} down in priority`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        className={`${styles.toggleSwitch} ${isEnabled ? styles.active : ""}`}
                        onClick={() => toggleSourceEnabled(sourceId)}
                        aria-label={`Toggle ${def.name}`}
                      >
                        <div className={styles.toggleThumb} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Karaoke Word-by-Word Priority Order */}
              <div style={{ marginTop: "24px", marginBottom: "10px", padding: "0 4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--palette-primary, #1ed760)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Karaoke Word-by-Word Priority
                </span>
                <p style={{ fontSize: "12px", opacity: 0.65, margin: "4px 0 12px 0" }}>
                  When Karaoke Mode is active, Nocturne searches these sources first for word-level syllable timestamps before falling back to line sync.
                </p>
              </div>

              {(settings.karaokeSourcesPriority || DEFAULT_KARAOKE_SOURCES_PRIORITY).map((sourceId, idx, arr) => {
                const def = ALL_LYRIC_SOURCES.find((s) => s.id === sourceId);
                if (!def) return null;

                return (
                  <div key={`k_${sourceId}`} className={`${styles.settingRow} ${styles.nested}`}>
                    <div className={styles.leftCol} style={{ gap: "14px" }}>
                      <span className={styles.sourceRankBadge}>
                        #{idx + 1}
                      </span>
                      <div className={styles.textWrapper}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3 className={styles.settingName}>{def.name}</h3>
                          <span className={styles.sourceCapabilityBadge} style={{ borderColor: "var(--palette-primary)" }}>
                            Word-by-Word Syllables
                          </span>
                        </div>
                        <span className={styles.settingDesc}>
                          {def.id === "netease" ? "NetEase YRC word timestamps" : def.id === "spotify" ? "Spotify syllable-synced color lyrics" : def.id === "kugou" ? "Kugou KRC character-by-character timing" : "LRCLIB progressive sweep"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.rightCol}>
                      <div className={styles.priorityButtonRow}>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveKaraokeSource(idx, "up")}
                          disabled={idx === 0}
                          title="Move up in karaoke priority"
                          aria-label={`Move ${def.name} up in karaoke priority`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveKaraokeSource(idx, "down")}
                          disabled={idx === arr.length - 1}
                          title="Move down in karaoke priority"
                          aria-label={`Move ${def.name} down in karaoke priority`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "visuals") && (
            <>
              <div id="sec-visuals" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="waves" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Visual Effects & Visualizer</span>
                <div className={styles.sectionHeaderLine} />
              </div>
          {/* 23. Audio Reactive Spectrum Visualizer */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10v4" />
                  <path d="M6 6v12" />
                  <path d="M10 3v18" />
                  <path d="M14 7v10" />
                  <path d="M18 5v14" />
                  <path d="M22 10v4" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Audio Reactive Spectrum Visualizer</h3>
                <span className={styles.settingDesc}>
                  Fluid frequency bars and audio sound waves dancing at the bottom of the lyrics
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.spectrumVisualizer ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    spectrumVisualizer: !prev.spectrumVisualizer,
                  }))
                }
                aria-label="Toggle audio spectrum visualizer"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Visualizer Style (Nested) */}
          {settings.spectrumVisualizer && (
            <div className={`${styles.settingRow} ${styles.nested}`}>
              <div className={styles.leftCol}>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Visualizer Style</h3>
                  <span className={styles.settingDesc}>
                    Choose between classic frequency bars, fluid waveform, or ambient pulse rings
                  </span>
                </div>
              </div>

              <div className={styles.rightCol}>
                <button
                  className={`${styles.dropdownButton} ${openDropdown === "spectrumStyle" ? styles.dropdownButtonActive : ""}`}
                  onClick={(e) => toggleDropdown("spectrumStyle", e)}
                >
                  <span>{settings.spectrumStyle}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {openDropdown === "spectrumStyle" && (
                  <div
                    className={`${styles.dropdownPopover} ${
                      dropdownDropUp ? styles.dropdownDropUp : ""
                    }`}
                    style={{ minWidth: "260px" }}
                  >
                    {spectrumStyleItems.map((item) => {
                      const isSelected = settings.spectrumStyle === item.value;
                      return (
                        <button
                          key={item.value}
                          className={`${styles.dropdownItem} ${
                            isSelected ? styles.dropdownItemSelected : ""
                          }`}
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              spectrumStyle: item.value,
                            }));
                            setOpenDropdown(null);
                          }}
                        >
                          {isSelected ? (
                            <div className={styles.selectedBar} />
                          ) : (
                            <div className={styles.emptyBar} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600 }}>{item.value}</span>
                            <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 24. Instrumental Break Dots (•••) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="19" cy="12" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Instrumental Break Dots (•••)</h3>
                <span className={styles.settingDesc}>
                  Animated pulsing dots with countdown to the next vocal line during long solos
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.instrumentalBreaks ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    instrumentalBreaks: !prev.instrumentalBreaks,
                  }))
                }
                aria-label="Toggle instrumental break dots"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 25. Vinyl Turntable Player Mode */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="18.5" y1="5.5" x2="16.5" y2="7.5" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Vinyl Turntable Player Mode</h3>
                <span className={styles.settingDesc}>
                  Display album artwork as a spinning vinyl record with animated realistic tonearm
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.vinylMode ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    vinylMode: !prev.vinylMode,
                  }))
                }
                aria-label="Toggle vinyl turntable mode"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Vinyl Display Style (Nested) */}
          {settings.vinylMode && (
            <div className={`${styles.settingRow} ${styles.nested}`}>
              <div className={styles.leftCol}>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Vinyl Player Style</h3>
                  <span className={styles.settingDesc}>
                    Choose between hi-fi turntable deck with tonearm or album jacket sleeve slide-out
                  </span>
                </div>
              </div>

              <div className={styles.rightCol}>
                <button
                  className={`${styles.dropdownButton} ${openDropdown === "vinylStyle" ? styles.dropdownButtonActive : ""}`}
                  onClick={(e) => toggleDropdown("vinylStyle", e)}
                >
                  <span>{settings.vinylStyle}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {openDropdown === "vinylStyle" && (
                  <div
                    className={`${styles.dropdownPopover} ${
                      dropdownDropUp ? styles.dropdownDropUp : ""
                    }`}
                    style={{ minWidth: "280px" }}
                  >
                    {vinylStyleItems.map((item) => {
                      const isSelected = settings.vinylStyle === item.value;
                      return (
                        <button
                          key={item.value}
                          className={`${styles.dropdownItem} ${
                            isSelected ? styles.dropdownItemSelected : ""
                          }`}
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              vinylStyle: item.value,
                            }));
                            setOpenDropdown(null);
                          }}
                        >
                          {isSelected ? (
                            <div className={styles.selectedBar} />
                          ) : (
                            <div className={styles.emptyBar} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600 }}>{item.value}</span>
                            <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 26. 3D Fluid Aurora Mesh Orbs */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <circle cx="15" cy="15" r="6" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>3D Fluid Aurora Mesh Orbs</h3>
                <span className={styles.settingDesc}>
                  Multi-layer luminous orbs drifting and blending behind lyrics based on album colors
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.auroraMeshOrbs ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    auroraMeshOrbs: !prev.auroraMeshOrbs,
                  }))
                }
                aria-label="Toggle 3D fluid aurora mesh orbs"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 27. Album Cover Ambient Edge Glow */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="16" x="4" y="4" rx="3" />
                  <path d="M4 8h16" />
                  <path d="M8 4v16" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Album Cover Ambient Edge Glow</h3>
                <span className={styles.settingDesc}>
                  Soft neon halo surrounding the album art that breathes in time with playback
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.albumEdgeGlow ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    albumEdgeGlow: !prev.albumEdgeGlow,
                  }))
                }
                aria-label="Toggle album cover ambient edge glow"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 28. Ambient Stardust Micro-Particles */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Ambient Stardust</h3>
                <span className={styles.settingDesc}>
                  Floating micro-particles gently drifting across the background
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.ambientStardust ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    ambientStardust: !prev.ambientStardust,
                  }))
                }
                aria-label="Toggle ambient stardust particles"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
            </>
          )}

          {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "playback") && (
            <>
              <div id="sec-playback" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="gear" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Sync & Spotify Controls</span>
                <div className={styles.sectionHeaderLine} />
              </div>

              {/* 1. Lyric Synchronization Calibration (ms) */}
              <div className={styles.settingRow}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <GruvboxIcon name="gear" size={18} />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Lyric Sync Offset (Calibration)</h3>
                    <span className={styles.settingDesc}>
                      Fine-tune lyric synchronization timing. Shift forward if lyrics lag behind music, or backward if lyrics appear too early.
                    </span>
                  </div>
                </div>

                <div className={styles.sliderControlCol}>
                  <div className={styles.blurSliderStepperRow}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      disabled={(settings.syncOffsetMs ?? 0) <= -2000}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: Math.max(-2000, (prev.syncOffsetMs ?? 0) - 50),
                        }))
                      }
                      title="Advance Lyrics (-50ms)"
                    >
                      −
                    </button>

                    <div className={styles.sliderTrackWrapper}>
                      <input
                        type="range"
                        min="-2000"
                        max="2000"
                        step="50"
                        value={settings.syncOffsetMs ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              syncOffsetMs: val,
                            }));
                          }
                        }}
                        onInput={(e) => {
                          const val = parseInt((e.target as HTMLInputElement).value, 10);
                          if (!isNaN(val)) {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              syncOffsetMs: val,
                            }));
                          }
                        }}
                        className={styles.blurSmoothSlider}
                        style={{
                          background: `linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) ${Math.max(0, Math.min(100, (((settings.syncOffsetMs ?? 0) + 2000) / 4000) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} ${Math.max(0, Math.min(100, (((settings.syncOffsetMs ?? 0) + 2000) / 4000) * 100))}%, ${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)`,
                        }}
                        title={`Sync Calibration Offset: ${(settings.syncOffsetMs ?? 0) > 0 ? "+" : ""}${settings.syncOffsetMs ?? 0}ms`}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.stepperBtn}
                      disabled={(settings.syncOffsetMs ?? 0) >= 2000}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: Math.min(2000, (prev.syncOffsetMs ?? 0) + 50),
                        }))
                      }
                      title="Delay Lyrics (+50ms)"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className={styles.stepperBtn}
                      style={{ fontSize: 11, width: "auto", padding: "0 8px" }}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: 0,
                        }))
                      }
                      title="Reset to 0ms (Default Sync)"
                    >
                      Reset
                    </button>

                    <span className={styles.sliderValueBadge}>
                      {(settings.syncOffsetMs ?? 0) > 0 ? `+${settings.syncOffsetMs}ms` : `${settings.syncOffsetMs ?? 0}ms`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Media Player Source Selector */}
              <div className={styles.settingRow}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <GruvboxIcon name="thunderbolt" size={18} />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Media Player Source</h3>
                    <span className={styles.settingDesc}>
                      Select which media player or browser instance to track via MPRIS (playerctl)
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <button
                    className={`${styles.dropdownButton} ${openDropdown === "mediaPlayer" ? styles.dropdownButtonActive : ""}`}
                    onClick={(e) => toggleDropdown("mediaPlayer", e)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {settings.preferredMediaPlayer && settings.preferredMediaPlayer !== "auto"
                        ? settings.preferredMediaPlayer
                        : "Auto-detect"}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {openDropdown === "mediaPlayer" && (
                    <div
                      className={`${styles.dropdownPopover} ${
                        dropdownDropUp ? styles.dropdownDropUp : ""
                      }`}
                      style={{ minWidth: "240px" }}
                    >
                      <button
                        className={`${styles.dropdownItem} ${
                          (!settings.preferredMediaPlayer || settings.preferredMediaPlayer === "auto")
                            ? styles.dropdownItemSelected
                            : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            preferredMediaPlayer: "auto",
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.dropdownItemLabel}>Auto-detect (Active Player)</span>
                      </button>
                      {activePlayers.map((p) => (
                        <button
                          key={p}
                          className={`${styles.dropdownItem} ${
                            settings.preferredMediaPlayer === p ? styles.dropdownItemSelected : ""
                          }`}
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              preferredMediaPlayer: p,
                            }));
                            setOpenDropdown(null);
                          }}
                        >
                          <span className={styles.dropdownItemLabel}>{p}</span>
                        </button>
                      ))}
                      {activePlayers.length === 0 && (
                        <div style={{ padding: "8px 12px", fontSize: "12px", opacity: 0.6 }}>
                          No active players found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

          {/* HQ Lossless Audio Provider Suite */}
          <div className={styles.settingsSectionHeader}>
            <span className={styles.sectionHeaderBadge}>
              <GruvboxIcon name="waves" size={13} />
            </span>
            <span className={styles.sectionHeaderTitle}>HQ Lossless Audio Provider</span>
            <div className={styles.sectionHeaderLine} />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Enable HQ Audio Provider</h3>
                <span className={styles.settingDesc}>
                  Play high-bitrate / lossless audio streams alongside synced karaoke
                </span>
              </div>
            </div>
            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${settings.hqAudioEnabled ? styles.active : ""}`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    hqAudioEnabled: !prev.hqAudioEnabled,
                  }))
                }
                aria-label="Toggle HQ audio provider"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {settings.hqAudioEnabled && (
            <div className={`${styles.settingRow} ${styles.nested}`}>
              <div className={styles.leftCol}>
                <div className={styles.iconWrapper}>
                  <GruvboxIcon name="waves" size={20} />
                </div>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>HQ Stream Quality</h3>
                  <span className={styles.settingDesc}>
                    Kuwo / Self-hosted audio resolution. High (320k) and Lossless (FLAC) supported.
                  </span>
                </div>
              </div>
              <div className={styles.rightCol}>
                <button
                  className={`${styles.dropdownButton} ${openDropdown === "hqQuality" ? styles.dropdownButtonActive : ""}`}
                  onClick={(e) => toggleDropdown("hqQuality", e)}
                >
                  <span>{settings.hqQuality || "High (320k)"}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === "hqQuality" && (
                  <div
                    className={`${styles.dropdownPopover} ${dropdownDropUp ? styles.dropdownDropUp : ""}`}
                    style={{ minWidth: "270px" }}
                  >
                    {hqQualityItems.map((item) => {
                      const isSelected = (settings.hqQuality || "High (320k)") === item.value;
                      return (
                        <button
                          key={item.value}
                          className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ""}`}
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              hqQuality: item.value,
                            }));
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{item.label}</span>
                          {isSelected && <span className={styles.dropdownCheck}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

              {/* 19. Wavy Progress Bar (Riff) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 3-2 4-2" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Wavy Progress Bar</h3>
                <span className={styles.settingDesc}>
                  Riff squiggly animated progress bar when playing music
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.wavyProgress ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    wavyProgress: !prev.wavyProgress,
                  }))
                }
                aria-label="Toggle wavy progress bar"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Waveform Style (Nested) */}
          {settings.wavyProgress && (
            <div className={`${styles.settingRow} ${styles.nested}`}>
              <div className={styles.leftCol}>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Waveform Style</h3>
                  <span className={styles.settingDesc}>
                    Choose between organic squiggly wave or continuous harmonic sine wave
                  </span>
                </div>
              </div>

              <div className={styles.rightCol}>
                <button
                  className={`${styles.dropdownButton} ${openDropdown === "waveformStyle" ? styles.dropdownButtonActive : ""}`}
                  onClick={(e) => toggleDropdown("waveformStyle", e)}
                >
                  <span>{settings.waveformStyle}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {openDropdown === "waveformStyle" && (
                  <div
                    className={`${styles.dropdownPopover} ${
                      dropdownDropUp ? styles.dropdownDropUp : ""
                    }`}
                    style={{ minWidth: "260px" }}
                  >
                    {waveformStyleItems.map((item) => {
                      const isSelected = settings.waveformStyle === item.value;
                      return (
                        <button
                          key={item.value}
                          className={`${styles.dropdownItem} ${
                            isSelected ? styles.dropdownItemSelected : ""
                          }`}
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              waveformStyle: item.value,
                            }));
                            setOpenDropdown(null);
                          }}
                        >
                          {isSelected ? (
                            <div className={styles.selectedBar} />
                          ) : (
                            <div className={styles.emptyBar} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600 }}>{item.value}</span>
                            <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
              {/* Apple TV Cinema View (Auto-Hide Controls) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.settingIcon}>
                <GruvboxIcon name="focus" size={18} color="var(--palette-primary)" />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Apple TV Cinema View</h3>
                <span className={styles.settingDesc}>
                  Auto-hide playback scrubber & controls when idle for an uncluttered TV experience
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.cinemaMode ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    cinemaMode: !prev.cinemaMode,
                  }))
                }
                aria-label="Toggle Apple TV cinema view"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Animated time status */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2 2" />
                  <path d="M5 3 2 6" />
                  <path d="m22 6-3-3" />
                  <path d="M12 2v3" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Animated time status</h3>
                <span className={styles.settingDesc}>
                  Enable animations for time status changes
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.animatedTimeStatus ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    animatedTimeStatus: !prev.animatedTimeStatus,
                  }))
                }
                aria-label="Toggle animated time status"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 11. Pulling effect */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="4" rx="2" />
                  <rect x="3" y="14" width="18" height="4" rx="2" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Pulling effect</h3>
                <span className={styles.settingDesc}>
                  Set power for pulling effect
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.dropdownButton} ${openDropdown === "pulling" ? styles.dropdownButtonActive : ""}`}
                onClick={(e) => toggleDropdown("pulling", e)}
              >
                <span>{settings.pullingEffect}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "pulling" && (
                <div
                  className={`${styles.dropdownPopover} ${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }`}
                  style={{ minWidth: "260px" }}
                >
                  {pullingItems.map((item) => {
                    const isSelected = settings.pullingEffect === item.value;
                    return (
                      <button
                        key={item.value}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemSelected : ""
                        }`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            pullingEffect: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              {/* 15. Zooming restore */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 3-3 3 3" />
                  <path d="m3 15 3 3 3-3" />
                  <path d="m21 9-3-3-3 3" />
                  <path d="m21 15-3 3-3-3" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Zooming restore</h3>
                <span className={styles.settingDesc}>
                  Restore zooming in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.zoomingRestore ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    zoomingRestore: !prev.zoomingRestore,
                  }))
                }
                aria-label="Toggle zooming restore"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 17. Prevent sleep */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Prevent sleep</h3>
                <span className={styles.settingDesc}>
                  Prevent from turning off display or sleeping
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.preventSleep ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    preventSleep: !prev.preventSleep,
                  }))
                }
                aria-label="Toggle prevent sleep"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
              {/* 18. FPS overlay */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <circle cx="8" cy="10" r="2" />
                  <path d="M12 10h4" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>FPS overlay</h3>
                <span className={styles.settingDesc}>
                  Show the current rendering FPS in Nocturne
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.fpsOverlay ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    fpsOverlay: !prev.fpsOverlay,
                  }))
                }
                aria-label="Toggle FPS overlay"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
            </>
          )}

          {(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "performance") && (
            <div className={styles.perfContainer}>
              <div id="sec-performance" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="thunderbolt" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Performance & Diagnostics</span>
                <div className={styles.sectionHeaderLine} />
              </div>

              {/* Zero Overhead Notice */}
              <div className={styles.perfNoticeBox}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <GruvboxIcon name="magic" size={15} />
                </div>
                <div>
                  <strong>Passive & Zero-Overhead Tracking:</strong>
                  <div style={{ opacity: 0.85, marginTop: 2 }}>
                    Latency measurements use sub-millisecond precision (<code>performance.now()</code>) with ~0.0001ms footprint.
                    When this tab is closed, all live FPS loops and hardware polling are fully deactivated (0.0% CPU overhead).
                  </div>
                </div>
              </div>

              {/* Card 1: Active Hardware GPU Detection */}
              <div className={styles.perfCard}>
                <div className={styles.perfHeader}>
                  <div className={styles.perfTitleGroup}>
                    <GruvboxIcon name="visuals" size={16} />
                    <h4 className={styles.perfTitle}>Graphics Processing Unit (GPU)</h4>
                  </div>
                  <span className={`${styles.perfBadge} ${styles.perfBadgeGreen}`}>
                    <span className={styles.perfBadgeDot} />
                    Hardware Accelerated
                  </span>
                </div>

                <div className={styles.perfGrid}>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>Hardware GPU</span>
                    <span className={styles.perfValue} style={{ fontSize: 13, color: "#38bdf8" }}>
                      {realGpu}
                    </span>
                    <span className={styles.perfSub}>Direct PCIe / Bus Detection</span>
                  </div>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>Rendering Pipeline</span>
                    <span className={styles.perfValue} style={{ fontSize: 13, color: "#2ecc71" }}>
                      High Performance
                    </span>
                    <span className={styles.perfSub}>
                      WebGL 2.0 Canvas Compositor
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: System Memory & Cache Footprint */}
              <div className={styles.perfCard}>
                <div className={styles.perfHeader}>
                  <div className={styles.perfTitleGroup}>
                    <GruvboxIcon name="gear" size={16} />
                    <h4 className={styles.perfTitle}>Process Memory & Cache Footprint</h4>
                  </div>
                  <span className={`${styles.perfBadge} ${styles.perfBadgeBlue}`}>
                    <span className={styles.perfBadgeDot} />
                    Live Monitored
                  </span>
                </div>

                <div className={styles.perfGrid}>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>Process RSS (RAM)</span>
                    <span className={styles.perfValue}>
                      {sysStats ? sysStats.processRssMb : "--"} <span className={styles.perfUnit}>MB</span>
                    </span>
                    <span className={styles.perfSub}>Resident Set Size</span>
                  </div>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>V8 Heap Used</span>
                    <span className={styles.perfValue}>
                      {sysStats ? sysStats.processHeapMb : "--"} <span className={styles.perfUnit}>MB</span>
                    </span>
                    <span className={styles.perfSub}>Active JS Heap</span>
                  </div>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>Persistent Cache</span>
                    <span className={styles.perfValue}>
                      {sysStats ? sysStats.cacheEntries : "--"} <span className={styles.perfUnit}>items</span>
                    </span>
                    <span className={styles.perfSub}>
                      {sysStats ? (sysStats.cacheSizeBytes / 1024).toFixed(1) + " KB disk" : "Local Disk"}
                    </span>
                  </div>
                  <div className={styles.perfItem}>
                    <span className={styles.perfLabel}>Visualizer Framerate</span>
                    <span className={styles.perfValue} style={{ color: fps >= 55 ? "#2ecc71" : "#f1c40f" }}>
                      {fps} <span className={styles.perfUnit}>FPS</span>
                    </span>
                    <span className={styles.perfSub} style={{ color: "#f59e0b" }}>
                      Target: 60 FPS (Dev Mode: Run <code>npm run build:release</code> for 60 FPS)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Real-Time Latency Benchmarks */}
              <div className={styles.perfCard}>
                <div className={styles.perfHeader}>
                  <div className={styles.perfTitleGroup}>
                    <GruvboxIcon name="waves" size={16} />
                    <h4 className={styles.perfTitle}>Real-Time Latency Benchmarks (Rolling 25 Samples)</h4>
                  </div>
                  <button
                    type="button"
                    className={styles.perfActionBtn}
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => resetMetrics()}
                    title="Reset Statistics"
                  >
                    <GruvboxIcon name="replay" size={12} />
                    <span>Reset Stats</span>
                  </button>
                </div>

                <div className={styles.perfTable}>
                  <div className={`${styles.perfTableRow} ${styles.perfTableHead}`}>
                    <span>Action / Operation</span>
                    <span>Min</span>
                    <span>Avg</span>
                    <span>Max</span>
                    <span>Latest</span>
                  </div>

                  <div className={styles.perfTableRow}>
                    <div>
                      <strong>Lyrics Fetch & Parse</strong>
                      {lyricsLoad.cachedCount ? (
                        <span className={styles.perfSub} style={{ display: "block", fontSize: 11, color: "#2ecc71" }}>
                          ({lyricsLoad.cachedCount} instant cache hits)
                        </span>
                      ) : null}
                    </div>
                    <span className={styles.perfLatencyValue}>{lyricsLoad.count ? `${lyricsLoad.min}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{lyricsLoad.count ? `${lyricsLoad.avg}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{lyricsLoad.count ? `${lyricsLoad.max}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue} style={{ color: "var(--palette-primary, #2ecc71)" }}>
                      {lyricsLoad.count ? `${lyricsLoad.latest}ms` : "--"}
                    </span>
                  </div>

                  <div className={styles.perfTableRow}>
                    <div>
                      <strong>Track Skip Speed</strong>
                      <span className={styles.perfSub} style={{ display: "block", fontSize: 11 }}>
                        Optimistic queue switch
                      </span>
                    </div>
                    <span className={styles.perfLatencyValue}>{skipSpeed.count ? `${skipSpeed.min}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{skipSpeed.count ? `${skipSpeed.avg}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{skipSpeed.count ? `${skipSpeed.max}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue} style={{ color: "var(--palette-primary, #2ecc71)" }}>
                      {skipSpeed.count ? `${skipSpeed.latest}ms` : "--"}
                    </span>
                  </div>

                  <div className={styles.perfTableRow}>
                    <div>
                      <strong>Playback Play / Pause</strong>
                      <span className={styles.perfSub} style={{ display: "block", fontSize: 11 }}>
                        Transport state toggle
                      </span>
                    </div>
                    <span className={styles.perfLatencyValue}>{playbackToggle.count ? `${playbackToggle.min}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{playbackToggle.count ? `${playbackToggle.avg}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{playbackToggle.count ? `${playbackToggle.max}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue} style={{ color: "var(--palette-primary, #2ecc71)" }}>
                      {playbackToggle.count ? `${playbackToggle.latest}ms` : "--"}
                    </span>
                  </div>

                  <div className={styles.perfTableRow}>
                    <div>
                      <strong>Seek Scrub Action</strong>
                      <span className={styles.perfSub} style={{ display: "block", fontSize: 11 }}>
                        Timeline seek dispatch
                      </span>
                    </div>
                    <span className={styles.perfLatencyValue}>{seekAction.count ? `${seekAction.min}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{seekAction.count ? `${seekAction.avg}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue}>{seekAction.count ? `${seekAction.max}ms` : "--"}</span>
                    <span className={styles.perfLatencyValue} style={{ color: "var(--palette-primary, #2ecc71)" }}>
                      {seekAction.count ? `${seekAction.latest}ms` : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

            </div>
          </div>

          {/* 3. RIGHT: Live Lyrics Preview Stage (Split mode only, matching Riff & Apple TV) */}
          {viewMode === "split" && settings.showLivePreview !== false && (
            <StudioLivePreviewPane
              settings={settings}
              song={song}
              songImage={songImage}
              previewPalette={previewPalette}
              blurPx={blurPx}
              previewFont={previewFont}
              previewScale={previewScale}
              previewActiveSize={previewActiveSize}
              previewInactiveColor={previewInactiveColor}
              previewLyricActiveColor={previewLyricActiveColor}
              previewOverlayBg={previewOverlayBg}
              previewFloatStyle={previewFloatStyle}
              previewAmbientStyle={previewAmbientStyle}
              linePrev={linePrev}
              lineActive={lineActive}
              lineNext={lineNext}
              isLightMode={isLightMode}
              currentPullPower={currentPullPower}
              onLeftPaneWheel={handleLeftPaneWheel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
