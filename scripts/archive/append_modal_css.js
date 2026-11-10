const fs = require('fs');
const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let css = fs.readFileSync(cssPath, 'utf8');

const sparkleRule = `
.particleSparkleActive {
  position: relative;
  text-shadow: 0 0 calc(24px * var(--sparkle-intensity, 0.65)) var(--ambient-glow, rgba(255, 255, 255, 0.65)),
               0 0 calc(42px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.5));
  animation: modalSparkleShimmer 2.5s ease-in-out infinite;
}

@keyframes modalSparkleShimmer {
  0%, 100% {
    filter: drop-shadow(0 0 calc(5px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.55)));
  }
  50% {
    filter: drop-shadow(0 0 calc(20px * var(--sparkle-intensity, 0.65)) var(--accent-color, rgba(56, 189, 248, 0.98)))
            drop-shadow(0 0 calc(36px * var(--sparkle-intensity, 0.65)) var(--ambient-glow, rgba(255, 255, 255, 0.75)))
            brightness(calc(1 + 0.22 * var(--sparkle-intensity, 0.65)));
  }
}
`;

if (!css.includes('.particleSparkleActive')) {
  css += sparkleRule;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Appended particleSparkleActive to SettingsModal.module.css');
} else {
  console.log('Already present in SettingsModal.module.css');
}
