const fs = require('fs');
const path = 'styles/SettingsModal.module.css';
let css = fs.readFileSync(path, 'utf8');

// Upgrade categoryTabsContainer height from 44px to 48px
css = css.replace(
  /\.categoryTabsContainer\s*\{[\s\S]*?flex-shrink:\s*0;\s*width:\s*100%;\s*\}/,
`.categoryTabsContainer {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 5px;
  height: 48px;
  min-height: 48px;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
}`
);

// Upgrade categoryTab height from 36px to 38px, font-size 13px
css = css.replace(
  /\.categoryTab\s*\{[\s\S]*?box-sizing:\s*border-box;\s*\}/,
`.categoryTab {
  flex: 1;
  min-width: 0;
  height: 38px;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  user-select: none;
  box-sizing: border-box;
}`
);

// Also ensure docked mode doesn't squeeze it too much
css = css.replace(
  /\.windowDocked\s+\.categoryNavHeader\s*\{[\s\S]*?\}/,
`.windowDocked .categoryNavHeader {
  padding: 14px 20px 12px 20px !important;
}`
);
css = css.replace(
  /\.windowDocked\s+\.categoryTab\s*\{[\s\S]*?\}/,
`.windowDocked .categoryTab {
  font-size: 11.5px !important;
  gap: 6px !important;
  padding: 0 6px !important;
  height: 36px !important;
  min-height: 36px !important;
}`
);

fs.writeFileSync(path, css, 'utf8');
console.log('Successfully polished category tabs CSS dimensions!');
