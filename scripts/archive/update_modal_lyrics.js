const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

// 1. Update imports
c = c.replace(
`  LyricSpeedOption,
  LyricGradientOption,`,
`  LyricSpeedOption,
  LyricGradientOption,
  LyricMovementOption,
  LyricColorScopeOption,`
);

// 2. Update fontItems
const oldFontItems = `  const fontItems: { value: FontPresetOption; desc: string; fontFamily: string }[] = [
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
      value: "Default",
      desc: "Apple SF Pro Display / System UI",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    },
    {
      value: "Custom",
      desc: "Monospace coding aesthetic",
      fontFamily: 'Consolas, Monaco, monospace',
    },
  ];`;

const newFontItems = `  const fontItems: { value: FontPresetOption; desc: string; fontFamily: string }[] = [
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
  ];`;

c = c.replace(oldFontItems, newFontItems);

// 3. Update lyricGradientItems
const oldGradientItems = `  const lyricGradientItems: { value: LyricGradientOption; desc: string }[] = [
    { value: "Album Accent Gradient", desc: "Dynamic multi-color gradient matching cover art" },
    { value: "White Pure Glow", desc: "Classic pure Apple Music white luminescence" },
    { value: "Vibrant Neon", desc: "Electric cyan, indigo, and violet neon glow" },
    { value: "Sunset Amber", desc: "Warm golden amber and sunset coral hues" },
  ];`;

const newGradientItems = `  const lyricGradientItems: { value: LyricGradientOption; desc: string }[] = [
    { value: "Album Accent Gradient", desc: "Adaptive tonal highlight matching cover art (M3 Engine)" },
    { value: "Rainbow Spectrum (Animated)", desc: "Continuous animated chromatic rainbow light stream" },
    { value: "White Pure Glow", desc: "Classic crystalline Apple Music white luminescence" },
    { value: "Espresso Amber & Gold", desc: "Warm Sabrina Carpenter golden honey glow" },
    { value: "Sunset Coral & Peach", desc: "Vibrant radiant sunset coral & warm peach" },
    { value: "Vibrant Neon", desc: "Electric cyan, sky blue, and violet neon glow" },
    { value: "Emerald Aurora", desc: "Lush mint emerald and teal aurora rays" },
    { value: "Royal Amethyst", desc: "Deep luxury amethyst violet and magenta" },
    { value: "Rose Quartz", desc: "Soft luxury blush pink luminescence" },
    { value: "Custom Color", desc: "Personalized custom hex color selection" },
  ];`;

c = c.replace(oldGradientItems, newGradientItems);

// 4. Update previewFont resolution
c = c.replace(
`  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Spotify Circular") {
    previewFont = '"CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    previewFont = '"SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Custom") {
    previewFont = 'Consolas, Monaco, monospace';
  }`,
`  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    previewFont = '"New York", "Playfair Display", "Georgia", serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    previewFont = '"CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    previewFont = '"SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    previewFont = '"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    previewFont = 'Consolas, Monaco, monospace';
  }`
);

// 5. Update previewLyricActiveColor
const oldActiveColorLogic = `  let previewLyricActiveColor = isLightMode ? "#111113" : "#ffffff";
  if (settings.lyricGradient === "Album Accent Gradient" && previewPalette?.primary) {
    previewLyricActiveColor = previewPalette.primary;
  } else if (settings.lyricGradient === "Vibrant Neon") {
    previewLyricActiveColor = "#38bdf8";
  } else if (settings.lyricGradient === "Sunset Amber") {
    previewLyricActiveColor = "#f59e0b";
  }`;

const newActiveColorLogic = `  let previewLyricActiveColor = isLightMode ? "#111113" : "#ffffff";
  if (settings.lyricGradient === "Rainbow Spectrum (Animated)") {
    previewLyricActiveColor = "#ff2a5f";
  } else if (settings.lyricGradient === "Album Accent Gradient" && previewPalette?.primary) {
    previewLyricActiveColor = previewPalette.primary;
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
  }`;

c = c.replace(oldActiveColorLogic, newActiveColorLogic);

// 6. Update previewFloatStyle logic to reflect settings.lyricMovement
const oldFloatStyleLogic = `  let previewFloatStyle: React.CSSProperties = {};
  if (settings.additionalAnimations && settings.karaokeMode) {
    if (settings.floatAnimation === "High (Default)") {
      previewFloatStyle = { animation: "lyricFloatHigh 3.5s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Medium") {
      previewFloatStyle = { animation: "lyricFloatMed 4s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Low") {
      previewFloatStyle = { animation: "lyricFloatLow 4.5s ease-in-out infinite" };
    }
  }`;

const newFloatStyleLogic = `  let previewFloatStyle: React.CSSProperties = {};
  if (settings.additionalAnimations && settings.karaokeMode) {
    if (settings.lyricMovement === "Apple TV Kinetic (Default)") {
      previewFloatStyle = { animation: "kineticFloatBreathe 4.5s ease-in-out infinite" };
    } else if (settings.lyricMovement === "Cinematic Center Snap") {
      previewFloatStyle = { animation: "cinematicSnapIn 0.38s cubic-bezier(0.19, 1, 0.22, 1)" };
    } else if (settings.lyricMovement === "Floating Wave Drift") {
      previewFloatStyle = { animation: "waveDriftFloat 5.2s ease-in-out infinite" };
    } else if (settings.lyricMovement === "Elastic Spring Pop") {
      previewFloatStyle = { animation: "elasticSpringPopIn 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)" };
    } else if (settings.lyricMovement === "Smooth Fade & Glide") {
      previewFloatStyle = { animation: "smoothGlideIn 0.62s cubic-bezier(0.25, 1, 0.5, 1)" };
    } else if (settings.lyricMovement === "Subtle Classic") {
      previewFloatStyle = {};
    } else if (settings.floatAnimation === "High (Default)") {
      previewFloatStyle = { animation: "lyricFloatHigh 3.5s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Medium") {
      previewFloatStyle = { animation: "lyricFloatMed 4s ease-in-out infinite" };
    } else if (settings.floatAnimation === "Low") {
      previewFloatStyle = { animation: "lyricFloatLow 4.5s ease-in-out infinite" };
    }
  }`;

c = c.replace(oldFloatStyleLogic, newFloatStyleLogic);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully updated modal variables and items!');
