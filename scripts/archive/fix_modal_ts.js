const fs = require('fs');

const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');

const target = `"--sparkle-intensity": ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),`;
const replacement = `["--sparkle-intensity" as any]: ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),`;

if (modalContent.includes(target)) {
  modalContent = modalContent.replace(target, replacement);
  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log('Fixed TypeScript custom CSS property in AppleMusicSettingsModal.tsx');
} else {
  console.log('Target not found in AppleMusicSettingsModal.tsx');
}
