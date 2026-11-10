const fs = require('fs');

const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const oldSparkleCSS = `.particleSparkleActive {
  position: relative;
  text-shadow: 0 0 20px var(--ambient-glow, rgba(255, 255, 255, 0.6)), 0 0 35px var(--accent-color, rgba(56, 189, 248, 0.4));
  animation: particleGlowShimmer 2.5s ease-in-out infinite;
}

@keyframes particleGlowShimmer {
  0%, 100% {
    filter: drop-shadow(0 0 4px var(--accent-color, rgba(56, 189, 248, 0.5)));
  }
  50% {
    filter: drop-shadow(0 0 16px var(--accent-color, rgba(56, 189, 248, 0.95))) brightness(1.15);
  }
}`;

const newSparkleCSS = `.particleSparkleActive {
  position: relative;
  text-shadow: 0 0 calc(24px * var(--sparkle-intensity, 0.65)) var(--ambient-glow, rgba(255, 255, 255, 0.65)),
               0 0 calc(42px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.5));
  animation: particleGlowShimmer 2.5s ease-in-out infinite;
}

@keyframes particleGlowShimmer {
  0%, 100% {
    filter: drop-shadow(0 0 calc(5px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.55)));
  }
  50% {
    filter: drop-shadow(0 0 calc(20px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.98)))
            drop-shadow(0 0 calc(36px * var(--sparkle-intensity, 0.65)) var(--ambient-glow, rgba(255, 255, 255, 0.75)))
            brightness(calc(1 + 0.22 * var(--sparkle-intensity, 0.65)));
  }
}`;

const isCRLF = cssContent.includes('\r\n');
const normContent = cssContent.replace(/\r\n/g, '\n');
const normOld = oldSparkleCSS.replace(/\r\n/g, '\n');
const normNew = newSparkleCSS.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  let updated = normContent.replace(normOld, normNew);
  if (isCRLF) updated = updated.replace(/\n/g, '\r\n');
  fs.writeFileSync(cssPath, updated, 'utf8');
  console.log('AppleMusic.module.css particle sparkle updated successfully');
} else {
  console.log('Could not find oldSparkleCSS in AppleMusic.module.css');
}
