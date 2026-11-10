const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/typings/LyricsSettings.ts';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

// 1. Update FontPresetOption
c = c.replace(
`export type FontPresetOption =
  | "Default"
  | "Spotify Mix"
  | "Spotify Circular"
  | "Custom";`,
`export type FontPresetOption =
  | "Default"
  | "Spotify Mix"
  | "Spotify Circular"
  | "Editorial Serif"
  | "SF Pro Display"
  | "Rounded Bubble"
  | "Custom";`
);

// 2. Add LyricMovementOption
const movementTypeDef = `export type LyricMovementOption =
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
`;

c = c.replace(
`export type FloatAnimationOption =`,
`${movementTypeDef}\nexport type FloatAnimationOption =`
);

// 3. Update LyricGradientOption with Rainbow and rich color options
c = c.replace(
`export type LyricGradientOption =
  | "Album Accent Gradient"
  | "White Pure Glow"
  | "Vibrant Neon"
  | "Sunset Amber";`,
`export type LyricGradientOption =
  | "Album Accent Gradient"
  | "Rainbow Spectrum (Animated)"
  | "White Pure Glow"
  | "Espresso Amber & Gold"
  | "Sunset Coral & Peach"
  | "Vibrant Neon"
  | "Emerald Aurora"
  | "Royal Amethyst"
  | "Rose Quartz"
  | "Custom Color";`
);

// 4. Update LyricsSettings interface
c = c.replace(
`  lyricGradient: LyricGradientOption;`,
`  lyricGradient: LyricGradientOption;
  lyricMovement: LyricMovementOption;
  lyricColorScope: LyricColorScopeOption;
  customLyricColor?: string;
  pinnedSongColors?: Record<string, string>;`
);

// 5. Update DEFAULT_LYRICS_SETTINGS
c = c.replace(
`  lyricGradient: "Album Accent Gradient",`,
`  lyricGradient: "Album Accent Gradient",
  lyricMovement: "Apple TV Kinetic (Default)",
  lyricColorScope: "Per-Song Adaptive",
  customLyricColor: "#f59e0b",
  pinnedSongColors: {},`
);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully updated LyricsSettings.ts!');
