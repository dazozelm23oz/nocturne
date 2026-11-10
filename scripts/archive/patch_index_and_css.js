const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics';

// 1. Update pages/index.tsx
const indexPath = path.join(baseDir, 'pages/index.tsx');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Check line 283-284:
// const isRainbow = settings.lyricGradient === "Rainbow Spectrum (Animated)";
// const rainbowClass = isRainbow && isActive ? styles.rainbowLyricLine : "";

const targetRainbow = `  const isRainbow = settings.lyricGradient === "Rainbow Spectrum (Animated)";
  const rainbowClass = isRainbow && isActive ? styles.rainbowLyricLine : "";`;

const replacementRainbow = `  const isRainbow = settings.lyricGradient === "Rainbow Spectrum (Animated)";
  const isMultiGradient = (
    settings.lyricGradient === "Album Vibrant Multi-Hue" ||
    settings.lyricGradient === "Album Warm Harmony" ||
    settings.lyricGradient === "Album Deep Contrast"
  );
  const rainbowClass = isRainbow && isActive ? styles.rainbowLyricLine : (isMultiGradient && isActive ? styles.gradientLyricLine : "");`;

if (indexContent.includes(targetRainbow)) {
  indexContent = indexContent.replace(targetRainbow, replacementRainbow);
  console.log('index.tsx rainbowClass logic updated to support isMultiGradient');
} else {
  console.error('targetRainbow not found in index.tsx');
}

fs.writeFileSync(indexPath, indexContent, 'utf8');

// 2. Update styles/AppleMusic.module.css
const cssPath = path.join(baseDir, 'styles/AppleMusic.module.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Add .gradientLyricLine rules after .rainbowLyricLine rules
const targetRainbowCss = `.rainbowLyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    #ff2a5f 0%,
    #ffc83b calc(var(--word-pct, 0%) * 0.5),
    #06b6d4 var(--word-pct, 0%),
    rgba(255, 255, 255, 0.95) calc(var(--word-pct, 0%) + 1%),
    rgba(255, 255, 255, 0.38) calc(var(--word-pct, 0%) + 6%),
    rgba(255, 255, 255, 0.38) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}`;

const newMultiHueRules = `

/* Multi-hue dynamic album gradient lines */
.gradientLyricLine.active {
  background: var(--active-lyric-color, #ffffff) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}

.gradientLyricLine.active .karaokeWord.wordCompleted {
  background: var(--active-lyric-color, #ffffff) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

.gradientLyricLine.active .karaokeWord.wordActive {
  background: var(--active-lyric-color, #ffffff) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  mask-image: linear-gradient(
    to right,
    #000000 0%,
    #000000 calc(var(--word-pct, 0%) - 1%),
    rgba(0, 0, 0, 0.38) calc(var(--word-pct, 0%) + 4%),
    rgba(0, 0, 0, 0.38) 100%
  ) !important;
  -webkit-mask-image: linear-gradient(
    to right,
    #000000 0%,
    #000000 calc(var(--word-pct, 0%) - 1%),
    rgba(0, 0, 0, 0.38) calc(var(--word-pct, 0%) + 4%),
    rgba(0, 0, 0, 0.38) 100%
  ) !important;
}`;

if (cssContent.includes(targetRainbowCss)) {
  cssContent = cssContent.replace(targetRainbowCss, targetRainbowCss + newMultiHueRules);
  console.log('AppleMusic.module.css updated with .gradientLyricLine rules');
} else {
  console.error('targetRainbowCss not found in AppleMusic.module.css');
}

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('CSS and index.tsx successfully updated');
