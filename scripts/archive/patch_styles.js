const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

// 1. Clean up invalid CSS line 53
c = c.replace('-webkit-/* removed redundant inner blur */\n', '');
c = c.replace('/* removed redundant inner blur */\n', '');

// 2. Fix .modalHeader and .headerControls
c = c.replace(
`.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  gap: 16px;
  flex-wrap: nowrap;
}`,
`.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.92));
  gap: 16px;
  flex-wrap: nowrap !important;
  min-height: 58px;
  box-sizing: border-box;
}`
);

// 3. Fix .headerControls
c = c.replace(
`.headerControls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}`,
`.headerControls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap !important;
  flex-shrink: 0;
}`
);

// 4. Fix .windowDocked tab labels so they don't leak out of box
c = c.replace(
`.windowDocked .tabLabelFull {
  display: inline !important;
}

.windowDocked .tabLabelShort {
  display: none !important;
}`,
`.windowDocked .tabLabelFull {
  display: none !important;
}

.windowDocked .tabLabelShort {
  display: inline !important;
}`
);

// 5. Fix .modalAuto section headers so they never become dark and unreadable
c = c.replace(
`.modalAuto .sectionGroupHeader {
  color: var(--palette-primary, #1db954) !important;
}

.modalAuto .sectionHeaderTitle {
  color: var(--palette-primary, #1db954) !important;
}`,
`.modalAuto .sectionGroupHeader {
  color: var(--modal-text, #ffffff) !important;
}

.modalAuto .sectionHeaderTitle {
  color: var(--modal-text, #ffffff) !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}`
);

// 6. Fix dropdown hovering so it doesn't look dark & murky
c = c.replace(
`.dropdownButton:hover {
  background: rgba(65, 65, 72, 0.95);
  border-color: rgba(255, 255, 255, 0.3);
}`,
`.dropdownButton:hover {
  background: var(--btn-neutral-hover, rgba(255, 255, 255, 0.14)) !important;
  border-color: var(--palette-primary, rgba(255, 255, 255, 0.35)) !important;
}`
);

// 7. Fix dropdown item hover in auto mode
c = c.replace(
`.modalAuto .dropdownItem:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}`,
`.modalAuto .dropdownItem:hover {
  background: var(--palette-primary, rgba(255, 255, 255, 0.22)) !important;
  color: var(--palette-contrast, #ffffff) !important;
}`
);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully polished SettingsModal.module.css!');
