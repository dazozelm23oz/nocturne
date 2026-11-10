const fs = require('fs');
let css = fs.readFileSync('styles/SettingsModal.module.css', 'utf8');

// 1. Add .windowCentered
if (!css.includes('.windowCentered')) {
  css += `\n
/* Window Centered Mode (ensures 100% height calculation and smooth scrolling) */
.windowCentered {
  width: 90vw !important;
  max-width: 860px !important;
  height: 86vh !important;
  max-height: 86vh !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
}

.settingRowHasOpenDropdown {
  z-index: 1000 !important;
}
`;
}

// 2. Expand windowDocked width from 560px to 720px
css = css.replace(/width:\s*500px\s*!important;/g, 'width: 720px !important;');
css = css.replace(/width:\s*560px\s*!important;/g, 'width: 720px !important;');

// 3. Fix splitContentContainer height & min-height
css = css.replace(
  /\.splitContentContainer\s*\{[\s\S]*?position:\s*relative;\s*\}/,
  `.splitContentContainer {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0 !important;
  height: calc(100% - 60px) !important;
  width: 100%;
  overflow: hidden;
  position: relative;
}`
);

// 4. Fix settingsPane height & min-height
css = css.replace(
  /\.settingsPane\s*\{[\s\S]*?position:\s*relative;\s*\}/,
  `.settingsPane {
  flex: 1;
  min-width: 0;
  min-height: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  overflow: hidden;
  position: relative;
}`
);

// 5. Fix nested settingRow
css = css.replace(
  /\.settingRow\.nested\s*\{[\s\S]*?border-left:[^;]+;\s*\}/,
  `.settingRow.nested {
  margin-left: 18px !important;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.04)) !important;
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.08)) !important;
  border-left: 3.5px solid var(--palette-primary, #1ed760) !important;
  border-radius: 10px !important;
}`
);

css = css.replace(
  /\.settingRow\.nested:hover\s*\{[\s\S]*?\}/,
  `.settingRow.nested:hover {
  background: var(--btn-neutral-hover, rgba(255, 255, 255, 0.08)) !important;
  border-left-color: var(--palette-primary, #1ed760) !important;
}`
);

// 6. Remove redundant backdrop-filter from dropdownButton
css = css.replace(
  /backdrop-filter:\s*blur\(12px\);/g,
  '/* backdrop-filter optimized */'
);
css = css.replace(
  /-webkit-backdrop-filter:\s*blur\(12px\);/g,
  '/* -webkit-backdrop-filter optimized */'
);

// 7. Fix expandButton
css = css.replace(
  /\.expandButton\s*\{[\s\S]*?transition:\s*transform\s*0\.2s\s*ease;\s*\}/,
  `.expandButton {
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08)) !important;
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.12)) !important;
  color: var(--palette-primary, #ffffff) !important;
  border-radius: 8px !important;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  transition: all 0.18s ease;
}`
);

// 8. Fix settingRow:hover overriding colors with #1c1c1c
css = css.replace(/\.settingRow:hover\s*\{\s*background:\s*#1c1c1c;\s*\}/g, '');

fs.writeFileSync('styles/SettingsModal.module.css', css, 'utf8');
console.log('SettingsModal.module.css updated successfully');
