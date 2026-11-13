import { LyricSourceId } from "@/lib/lyricsSources";

export type BackgroundOption =
  | "Static"
  | "Dynamic"
  | "Dynamic (Beating)"
  | "3D Fluid Aurora"
  | "Isolation (Beta)"
  | "Apple Music";

export type PaletteAlgorithmOption =
  | "Auto (Beta)"
  | "KMeans"
  | "OctTree"
  | "MedianCut (Preset 1)"
  | "MedianCut (Preset 2)";

export type FontPresetOption =
  | "Default"
  | "Spotify Mix"
  | "Spotify Circular"
  | "Editorial Serif"
  | "SF Pro Display"
  | "Rounded Bubble"
  | "Custom";

export type LyricMovementOption =
  | "Apple TV Kinetic (Default)"
  | "Cinematic Center Snap"
  | "Floating Wave Drift"
  | "Elastic Spring Pop"
  | "Smooth Fade & Glide"
  | "Subtle Classic";

export type LyricColorScopeOption =
  | "Per-Song Adaptive"
  | "Standard Across All Songs"
  | "Per-Song Pinned";

export type FloatAnimationOption =
  | "High (Default)"
  | "Medium"
  | "Low"
  | "Off";

export type PullingEffectOption =
  | "Disabled"
  | "Low"
  | "Regular"
  | "Medium (Default)"
  | "High"
  | "Tremendous";

export type StylePresetOption =
  | "iOS 26.4 and later"
  | "iOS 26.0"
  | "iOS 17.1"
  | "iOS 16.4"
  | "iOS 16.3"
  | "iOS 16.2"
  | "iOS 15"
  | "Android (New)"
  | "Android (Old)"
  | "Custom";

export type ThemeOption = "Dark" | "Light" | "Auto (Album Art)";

export type LyricEasingOption =
  | "Cubic-Bezier (Smooth)"
  | "Linear"
  | "Ease-In-Out"
  | "Expressive Spring";

export type LyricSpeedOption =
  | "Normal (1.0x)"
  | "Fast (1.2x)"
  | "Relaxed (0.8x)"
  | "Dynamic Track Speed";

export type LyricGradientOption =
  | "Album Accent Gradient"
  | "Album Vibrant Multi-Hue"
  | "Album Warm Harmony"
  | "Album Deep Contrast"
  | "Rainbow Spectrum (Animated)"
  | "White Pure Glow"
  | "Espresso Amber & Gold"
  | "Sunset Coral & Peach"
  | "Vibrant Neon"
  | "Emerald Aurora"
  | "Royal Amethyst"
  | "Rose Quartz"
  | "Custom Color";

export type VinylStyleOption = "Turntable Deck" | "Sleeve Slide-Out";

export type SpectrumStyleOption =
  | "Bars (Classic)"
  | "Waveform (Fluid)"
  | "Ambient Pulse";

export type WaveformStyleOption = "Squiggly Wave" | "Fluid Sine Wave";

export type HqQualityOption = "Standard (128k)" | "High (320k)" | "Lossless (FLAC)" | "Hi-Res (24-bit FLAC)";

export interface LyricsSettings {
  theme: ThemeOption;
  background: BackgroundOption;
  paletteAlgorithm: PaletteAlgorithmOption;
  blurLyrics: boolean;
  blurLevel: number; // 1 to 5
  autoUnblur: boolean;
  boldText: boolean;
  fontPreset: FontPresetOption;
  karaokeMode: boolean;
  disableCJKKaraoke: boolean;
  additionalAnimations: boolean;
  floatAnimation: FloatAnimationOption;
  wordShine: boolean;
  cjkWordShine: boolean;
  syllableMagnify: boolean;
  duetView: boolean;
  rightAlignFirst: boolean;

  // Riff & visual customization options
  wavyProgress: boolean;
  waveformStyle: WaveformStyleOption;
  lyricEasing: LyricEasingOption;
  lyricSpeed: LyricSpeedOption;
  lyricGradient: LyricGradientOption;
  lyricMovement: LyricMovementOption;
  lyricColorScope: LyricColorScopeOption;
  customLyricColor?: string;
  pinnedSongColors?: Record<string, string>;

  // New settings options
  pullingEffect: PullingEffectOption;
  animatedTimeStatus: boolean;
  zoomingRestore: boolean;
  stylePreset: StylePresetOption;
  preventSleep: boolean;
  fpsOverlay: boolean;

  // Visual Features Suite (Riff-inspired)
  spectrumVisualizer: boolean;
  spectrumStyle: SpectrumStyleOption;
  instrumentalBreaks: boolean;
  vinylMode: boolean;
  vinylStyle: VinylStyleOption;
  auroraMeshOrbs: boolean;
  albumEdgeGlow: boolean;
  ambientStardust: boolean;

  // Typography & Karaoke Visuals
  dynamicLineScaling: boolean;
  particleSparkle: boolean;
  particleSparkleIntensity: number; // 1 to 100 (%)
  karaokeBouncingBall: boolean;
  vocalistBadges: boolean;

  // Settings Modal Glass & Translucency
  modalGlassBlur: number;
  modalGlassOpacity: number;
  showLivePreview: boolean;
  syncOffsetMs: number;
  cinemaMode: boolean;

  // HQ Audio Provider Suite
  hqAudioEnabled: boolean;
  hqQuality: HqQualityOption;

  // Linux Media Player Source Selector
  preferredMediaPlayer?: string;

  // Multiple Lyric & Karaoke Sources Priority
  lyricSourcesPriority: LyricSourceId[];
  karaokeSourcesPriority: LyricSourceId[];
  disabledLyricSources: LyricSourceId[];

  // Music Hub & Playback Architecture
  prefetchCount: number;
  themeCatalog: "Liner Dark" | "Glass" | "Nord" | "Catppuccin" | "Gruvbox" | "Auto";
  soloistPort: number;

  // Comprehensive Settings Dashboard
  startupView: "Home" | "Now Playing" | "Library";
  rememberLastTab: boolean;
  closeToSystemTray: boolean;

  ytdlpAudioFormat: "webm" | "mp4" | "best";
  crossfadeDuration: number;
  normalizeVolume: boolean;

  glassBlurIntensity: number;
  visualizerStyle: "Bars" | "Waveform" | "Ambient Pulse";
  uiScale: number;
  showLyricsTranslation: boolean;

  ytMusicCookie: string;
  discordRichPresence: boolean;
  discordStatusText: "Listening to {song}" | "Playing {artist}";

  downloadFolder: string;
}

export const DEFAULT_LYRICS_SETTINGS: LyricsSettings = {
  theme: "Auto (Album Art)",
  background: "Isolation (Beta)",
  paletteAlgorithm: "Auto (Beta)",
  blurLyrics: true,
  blurLevel: 1,
  autoUnblur: false,
  boldText: false,
  fontPreset: "Spotify Circular",
  karaokeMode: true,
  disableCJKKaraoke: false,
  additionalAnimations: true,
  floatAnimation: "High (Default)",
  wordShine: true,
  cjkWordShine: false,
  syllableMagnify: true,
  duetView: true,
  rightAlignFirst: false,

  // Riff visual customization defaults
  wavyProgress: true,
  waveformStyle: "Squiggly Wave",
  lyricEasing: "Cubic-Bezier (Smooth)",
  lyricSpeed: "Normal (1.0x)",
  lyricGradient: "Album Accent Gradient",
  lyricMovement: "Apple TV Kinetic (Default)",
  lyricColorScope: "Per-Song Adaptive",
  customLyricColor: "#f59e0b",
  pinnedSongColors: {},

  // New settings defaults
  pullingEffect: "Medium (Default)",
  animatedTimeStatus: false,
  zoomingRestore: false,
  stylePreset: "iOS 26.0",
  preventSleep: false,
  fpsOverlay: false,

  // Visual Features defaults
  spectrumVisualizer: true,
  spectrumStyle: "Bars (Classic)",
  instrumentalBreaks: true,
  vinylMode: false,
  vinylStyle: "Turntable Deck",
  auroraMeshOrbs: true,
  albumEdgeGlow: true,
  ambientStardust: true,

  // Typography & Karaoke Visual defaults
  dynamicLineScaling: true,
  particleSparkle: true,
  particleSparkleIntensity: 65,
  karaokeBouncingBall: false,
  vocalistBadges: true,

  // Settings Modal Glass defaults (Frosted Glass & Translucency)
  modalGlassBlur: 28,
  modalGlassOpacity: 75,
  showLivePreview: true,
  syncOffsetMs: 0,
  cinemaMode: true,

  // HQ Audio Provider Suite defaults
  hqAudioEnabled: false,
  hqQuality: "High (320k)",
  preferredMediaPlayer: "auto",

  // Multiple Lyric & Karaoke Sources Priority Defaults
  lyricSourcesPriority: ["lrclib", "netease", "spotify", "kugou", "musixmatch", "genius"],
  karaokeSourcesPriority: ["netease", "spotify", "kugou", "lrclib"],
  disabledLyricSources: [],

  // Music Hub Defaults
  prefetchCount: 2,
  themeCatalog: "Liner Dark",
  soloistPort: 8000,

  startupView: "Home",
  rememberLastTab: true,
  closeToSystemTray: false,

  ytdlpAudioFormat: "webm",
  crossfadeDuration: 0,
  normalizeVolume: false,

  glassBlurIntensity: 24,
  visualizerStyle: "Bars",
  uiScale: 100,
  showLyricsTranslation: false,

  ytMusicCookie: "",
  discordRichPresence: false,
  discordStatusText: "Listening to {song}",

  downloadFolder: "~/nocturne-hq/downloads",
};
