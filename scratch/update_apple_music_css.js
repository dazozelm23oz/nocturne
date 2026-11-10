const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let css = fs.readFileSync(path, 'utf8');

if (!css.includes('.lyricSourceIndicator')) {
  const extra = `
/* Active Lyric Source Indicator */
.lyricSourceIndicator {
  position: absolute;
  bottom: 24px;
  right: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  z-index: 10;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.lyricSourceIndicator:hover {
  background: rgba(0, 0, 0, 0.65);
  border-color: var(--palette-primary, #1ed760);
  color: #ffffff;
  transform: translateY(-1px);
}

.sourceDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--palette-primary, #1ed760);
  box-shadow: 0 0 6px var(--palette-primary, #1ed760);
}

.wordSyncBadge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--palette-primary, #1ed760);
  color: #0b0f19;
  letter-spacing: 0.06em;
}
`;
  css += '\n' + extra;
  fs.writeFileSync(path, css, 'utf8');
  console.log('Appended lyricSourceIndicator CSS');
}
