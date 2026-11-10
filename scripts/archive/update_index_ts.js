const fs = require('fs');

const indexPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/pages/index.tsx';
let content = fs.readFileSync(indexPath, 'utf8');

const target = `"--active-lyric-color": lyricGradientColor,`;
const replacement = `"--active-lyric-color": lyricGradientColor,\n                "--sparkle-intensity": ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('pages/index.tsx updated successfully with --sparkle-intensity');
} else {
  console.log('Target not found in pages/index.tsx');
}
