const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `.gradientLyricLine.active {
  background: var(--active-lyric-color, #ffffff) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}`;

const newBlock = `.gradientLyricLine.active {
  color: var(--active-lyric-color, #ffffff);
}

.gradientLyricLine.active .karaokeWord.wordUnplayed {
  color: rgba(255, 255, 255, 0.38) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.38) !important;
  background: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
  mask-image: none !important;
  -webkit-mask-image: none !important;
}`;

const isCRLF = content.includes('\r\n');
const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  let updated = normContent.replace(normOld, normNew);
  if (isCRLF) {
    updated = updated.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(file, updated, 'utf8');
  console.log('Successfully updated AppleMusic.module.css');
} else {
  console.log('Target block not found in AppleMusic.module.css');
}
