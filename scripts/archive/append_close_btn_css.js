const fs = require('fs');

const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let css = fs.readFileSync(cssPath, 'utf8');

const exitStyles = `
/* Application Exit / Close App Button in Settings Header */
.appCloseBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.32);
  color: #fca5a5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.16s ease;
  user-select: none;
  flex-shrink: 0;
}

.appCloseBtn:hover {
  background: rgba(239, 68, 68, 0.9);
  border-color: #ef4444;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
  transform: translateY(-1px);
}

.appCloseBtn:active {
  transform: scale(0.97);
}
`;

if (!css.includes('.appCloseBtn')) {
  css += exitStyles;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Added .appCloseBtn styles to SettingsModal.module.css');
} else {
  console.log('.appCloseBtn already in SettingsModal.module.css');
}
