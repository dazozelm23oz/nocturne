const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let css = fs.readFileSync(path, 'utf8');

if (!css.includes('.sourceRankBadge')) {
  const extraCss = `
/* ==========================================================================
   Lyrics & Karaoke Multi-Source Priority Styles
   ========================================================================== */
.sourceRankBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--palette-primary, #1ed760);
  color: #0b0f19;
  box-shadow: 0 0 10px var(--palette-glow, rgba(30, 215, 96, 0.4));
  flex-shrink: 0;
}

.sourceRankBadge.dimmed {
  background: rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.6) !important;
  box-shadow: none !important;
}

.sourceCapabilityBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4px;
  width: fit-content;
}

.priorityButtonRow {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priorityButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.priorityButton:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  border-color: var(--palette-primary, #1ed760);
  color: #ffffff;
  transform: translateY(-1px);
}

.priorityButton:disabled {
  opacity: 0.28;
  cursor: not-allowed;
  pointer-events: none;
}
`;
  css += '\n' + extraCss;
  fs.writeFileSync(path, css, 'utf8');
  console.log('Appended source priority CSS');
} else {
  console.log('Already present');
}
