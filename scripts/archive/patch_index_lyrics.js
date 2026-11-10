const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/pages/index.tsx';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

// 1. Update animClass & rainbowClass in KaraokeLine
const oldAnimBlock = `  // Determine animation classes
  let animClass = "";
  if (isActive && settings.additionalAnimations) {
    if (settings.floatAnimation === "High (Default)") animClass = styles.floatHigh;
    else if (settings.floatAnimation === "Medium") animClass = styles.floatMedium;
    else if (settings.floatAnimation === "Low") animClass = styles.floatLow;
  }`;

const newAnimBlock = `  // Determine animation classes
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
  const rainbowClass = isRainbow && isActive ? styles.rainbowLyricLine : "";`;

c = c.replace(oldAnimBlock, newAnimBlock);

// 2. Add rainbowClass to lyricLine
c = c.replace(
`      className={\`\${styles.lyricLine} \${
        isActive ? styles.active : styles.inactive
      } \${animClass} \${scaleClass} \${
        allowWordShine ? styles.wordShining : ""
      } \${
        isActive && settings.particleSparkle ? styles.particleSparkleActive : ""
      } \${isDuet ? styles.duetRight : ""}\`}`,
`      className={\`\${styles.lyricLine} \${
        isActive ? styles.active : styles.inactive
      } \${animClass} \${scaleClass} \${rainbowClass} \${
        allowWordShine ? styles.wordShining : ""
      } \${
        isActive && settings.particleSparkle ? styles.particleSparkleActive : ""
      } \${isDuet ? styles.duetRight : ""}\`}`
);

// 3. Update scrolling logic
const oldScrollEffect = `  useEffect(() => {
    if (karoke.index !== null && karoke.index !== undefined && !isUserScrolling) {
      const activeEl = document.getElementById(\`lyric-line-\${karoke.index}\`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [karoke.index, isUserScrolling]);`;

const newScrollEffect = `  useEffect(() => {
    if (karoke.index !== null && karoke.index !== undefined && !isUserScrolling) {
      const activeEl = document.getElementById(\`lyric-line-\${karoke.index}\`);
      const scroller = scrollerRef.current;
      if (activeEl && scroller) {
        if (settings.lyricMovement === "Cinematic Center Snap") {
          activeEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          // Apple TV Kinetic or smooth custom scroll
          const targetScroll = activeEl.offsetTop - (scroller.clientHeight * 0.42);
          scroller.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: "smooth",
          });
        }
      } else if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [karoke.index, isUserScrolling, settings.lyricMovement]);`;

c = c.replace(oldScrollEffect, newScrollEffect);

// 4. Update fontStack
const oldFontStack = `  let fontStack = '-apple-system, BlinkMacSystemFont, \"SF Pro Display\", sans-serif';
  if (settings.fontPreset === \"Spotify Circular\") {
    fontStack = '\"CircularStd\", \"Circular\", -apple-system, \"Segoe UI\", sans-serif';
  } else if (settings.fontPreset === \"Spotify Mix\") {
    fontStack = '\"SpotifyMix\", -apple-system, \"Segoe UI\", sans-serif';
  } else if (settings.fontPreset === \"Custom\") {
    fontStack = 'Consolas, Monaco, \"Courier New\", monospace';
  }`;

const newFontStack = `  let fontStack = '-apple-system, BlinkMacSystemFont, \"SF Pro Display\", sans-serif';
  if (settings.fontPreset === \"Editorial Serif\") {
    fontStack = '\"New York\", \"Playfair Display\", \"Cormorant Garamond\", \"Georgia\", serif';
  } else if (settings.fontPreset === \"Spotify Circular\") {
    fontStack = '\"CircularStd\", \"Circular\", -apple-system, \"Segoe UI\", sans-serif';
  } else if (settings.fontPreset === \"Spotify Mix\") {
    fontStack = '\"SpotifyMix\", -apple-system, \"Segoe UI\", sans-serif';
  } else if (settings.fontPreset === \"SF Pro Display\") {
    fontStack = '-apple-system, BlinkMacSystemFont, \"SF Pro Display\", sans-serif';
  } else if (settings.fontPreset === \"Rounded Bubble\") {
    fontStack = '\"SF Pro Rounded\", \"Arial Rounded MT Bold\", \"Nunito\", sans-serif';
  } else if (settings.fontPreset === \"Custom\") {
    fontStack = 'Consolas, Monaco, \"Courier New\", monospace';
  }`;

c = c.replace(oldFontStack, newFontStack);

// 5. Update lyricGradientColor resolution with per-song pinned support & new color presets
const oldGradientColor = `  let lyricGradientColor = paletteColors?.primary || (isLightMode ? "#111113" : "#ffffff");
  if (settings.lyricGradient === "White Pure Glow") {
    lyricGradientColor = isLightMode ? "#111113" : "#ffffff";
  } else if (settings.lyricGradient === "Vibrant Neon") {
    lyricGradientColor = "#38bdf8";
  } else if (settings.lyricGradient === "Sunset Amber") {
    lyricGradientColor = "#f59e0b";
  }`;

const newGradientColor = `  const songKey = song?.uri || (song?.name && song?.artists ? \`\${song.name}-\${song.artists}\` : "");
  const pinnedColor = songKey && settings.pinnedSongColors ? settings.pinnedSongColors[songKey] : null;

  let effectiveGradient = pinnedColor || settings.lyricGradient || "Album Accent Gradient";
  if (settings.lyricColorScope === "Per-Song Adaptive" && !pinnedColor && settings.lyricGradient === "Album Accent Gradient") {
    effectiveGradient = "Album Accent Gradient";
  }

  let lyricGradientColor = paletteColors?.primary || (isLightMode ? "#111113" : "#ffffff");
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
  }`;

c = c.replace(oldGradientColor, newGradientColor);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully updated pages/index.tsx with movement styles, rainbow, and color presets!');
