const fs = require('fs');

const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const oldRainbowBlock = `.rainbowLyricLine.active {
  background: linear-gradient(
    90deg,
    #ff2a5f 0%,
    #ff7e40 16%,
    #ffc83b 32%,
    #10b981 48%,
    #06b6d4 64%,
    #6366f1 80%,
    #ec4899 92%,
    #ff2a5f 100%
  ) !important;
  background-size: 250% 100% !important;
  animation: rainbowFlowShift 4s linear infinite !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
  filter: drop-shadow(0 0 18px rgba(255, 42, 95, 0.45))
          drop-shadow(0 0 32px rgba(6, 182, 212, 0.35)) !important;
}`;

const newRainbowBlock = `.rainbowLyricLine.active {
  filter: drop-shadow(0 0 18px rgba(255, 42, 95, 0.45))
          drop-shadow(0 0 32px rgba(6, 182, 212, 0.35)) !important;
}

.rainbowLyricLine.active .karaokeWord.wordUnplayed {
  color: rgba(255, 255, 255, 0.38) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.38) !important;
  background: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
  mask-image: none !important;
  -webkit-mask-image: none !important;
}`;

const isCRLF = cssContent.includes('\r\n');
const normContent = cssContent.replace(/\r\n/g, '\n');
const normOld = oldRainbowBlock.replace(/\r\n/g, '\n');
const normNew = newRainbowBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  let updated = normContent.replace(normOld, normNew);
  if (isCRLF) updated = updated.replace(/\n/g, '\r\n');
  fs.writeFileSync(cssPath, updated, 'utf8');
  console.log('Successfully updated rainbowLyricLine rules in AppleMusic.module.css');
} else {
  console.log('oldRainbowBlock not found in AppleMusic.module.css');
}
