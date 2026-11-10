const fs = require('fs');
const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace .modalHeader & .modalTitle base block
const oldHeaderBlock = `.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px 28px;
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
  -webkit-backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
}

.modalTitle {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}`;

const newHeaderBlock = `.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
  -webkit-backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
  gap: 16px;
  flex-wrap: nowrap;
}

.modalTitle {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--modal-title-color, var(--palette-primary, var(--modal-text, #ffffff)));
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.studioHeaderBadge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.15));
  color: var(--palette-primary, #ffffff);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.headerControls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.headerDivider {
  width: 1px;
  height: 18px;
  background: var(--btn-neutral-border, rgba(255, 255, 255, 0.15));
  margin: 0 4px;
  flex-shrink: 0;
}`;

// Normalize line endings before replacing
let normCss = css.replace(/\r\n/g, '\n');
const normOldHeader = oldHeaderBlock.replace(/\r\n/g, '\n');
const normNewHeader = newHeaderBlock.replace(/\r\n/g, '\n');

if (!normCss.includes(normOldHeader)) {
  console.error("oldHeaderBlock not found in SettingsModal.module.css!");
  process.exit(1);
}

normCss = normCss.replace(normOldHeader, normNewHeader);

// Update .viewModeSwitcher and buttons base styles in Section
const oldControlsSection = `/* ==========================================================================
   NOCTURNE STUDIO ENHANCED CONTROLS & SUB-NAVIGATION
   ========================================================================== */
.headerActionPill,
.previewToggleBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--modal-text, #ffffff);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.headerActionPill:hover,
.previewToggleBtn:hover {
  background: var(--palette-primary, #ffffff);
  color: var(--palette-contrast, #000000);
  box-shadow: 0 2px 10px var(--palette-glow, rgba(255, 255, 255, 0.25));
}

.closeButtonCircular {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--modal-text, #ffffff);
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.closeButtonCircular:hover {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  transform: scale(1.05);
}`;

const newControlsSection = `/* ==========================================================================
   NOCTURNE STUDIO ENHANCED CONTROLS & SUB-NAVIGATION
   ========================================================================== */
.viewModeSwitcher {
  display: inline-flex;
  align-items: center;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.12));
  border-radius: 9999px;
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

.viewModeBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--modal-text-dim, rgba(255, 255, 255, 0.65));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  user-select: none;
}

.viewModeBtn:hover {
  color: var(--modal-text, #ffffff);
  background: var(--btn-neutral-hover, rgba(255, 255, 255, 0.1));
}

.viewModeActive {
  background: var(--palette-primary, #ffffff) !important;
  color: var(--palette-contrast, #000000) !important;
  box-shadow: 0 2px 10px var(--palette-glow, rgba(255, 255, 255, 0.25)) !important;
}

.headerActionPill,
.previewToggleBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 9999px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--palette-primary, var(--modal-text, #ffffff));
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
}

.previewToggleOff {
  opacity: 0.75;
}

.headerActionPill:hover,
.previewToggleBtn:hover {
  background: var(--palette-primary, #ffffff);
  color: var(--palette-contrast, #000000);
  border-color: var(--palette-primary, #ffffff);
  box-shadow: 0 2px 10px var(--palette-glow, rgba(255, 255, 255, 0.25));
}

.closeButtonCircular {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--modal-text, #ffffff);
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.closeButtonCircular:hover {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  transform: scale(1.05);
}`;

const normOldControls = oldControlsSection.replace(/\r\n/g, '\n');
const normNewControls = newControlsSection.replace(/\r\n/g, '\n');

if (!normCss.includes(normOldControls)) {
  console.error("oldControlsSection not found in SettingsModal.module.css!");
  process.exit(1);
}

normCss = normCss.replace(normOldControls, normNewControls);

// Add modal theme responsive rules to ensure all titles, section groups, jump links, and badges take theme color
const themeOverrides = `
/* ==========================================================================
   DYNAMIC THEME REACTIVITY OVERRIDES
   ========================================================================== */
.modalAuto .modalTitle {
  color: var(--palette-primary, #1db954) !important;
  text-shadow: 0 0 24px var(--palette-glow, rgba(29, 185, 84, 0.3));
}

.modalAuto .studioHeaderBadge {
  background: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.12) !important;
  border-color: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.28) !important;
  color: var(--palette-primary, #1db954) !important;
}

.modalAuto .sectionGroupHeader {
  color: var(--palette-primary, #1db954) !important;
}

.modalAuto .sectionHeaderTitle {
  color: var(--palette-primary, #1db954) !important;
}

.modalAuto .sectionHeaderLine {
  background: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.22) !important;
}

.modalAuto .subJumpBtn.subJumpActive {
  color: var(--palette-primary, #1db954) !important;
  border-left-color: var(--palette-primary, #1db954) !important;
}

.modalAuto .sliderValueBadge {
  color: var(--palette-primary, #1db954) !important;
  background: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.12) !important;
  border-color: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.25) !important;
}

.modalAuto .stepperBtn {
  color: var(--palette-primary, #1db954) !important;
  border-color: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.25) !important;
}

.modalAuto .stepperBtn:hover {
  background: var(--palette-primary, #1db954) !important;
  color: var(--palette-contrast, #ffffff) !important;
}

.modalLight .modalTitle {
  color: #111113 !important;
}

.modalLight .studioHeaderBadge {
  background: rgba(0, 113, 227, 0.08) !important;
  border-color: rgba(0, 113, 227, 0.2) !important;
  color: #0071e3 !important;
}

.modalLight .sectionGroupHeader,
.modalLight .sectionHeaderTitle {
  color: #0071e3 !important;
}

.modalLight .sectionHeaderLine {
  background: rgba(0, 113, 227, 0.16) !important;
}

.modalLight .subJumpBtn.subJumpActive {
  color: #0071e3 !important;
  border-left-color: #0071e3 !important;
}

.modalLight .sliderValueBadge {
  color: #0071e3 !important;
  background: rgba(0, 113, 227, 0.08) !important;
  border-color: rgba(0, 113, 227, 0.22) !important;
}

.modalLight .stepperBtn {
  color: #111113 !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.modalLight .stepperBtn:hover {
  background: #0071e3 !important;
  color: #ffffff !important;
}

.modalDark .modalTitle {
  color: #ffffff !important;
}

.modalDark .studioHeaderBadge {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

.modalDark .sectionGroupHeader,
.modalDark .sectionHeaderTitle {
  color: #1ed760 !important;
}

.modalDark .sectionHeaderLine {
  background: rgba(30, 215, 96, 0.2) !important;
}

.modalDark .subJumpBtn.subJumpActive {
  color: #1ed760 !important;
  border-left-color: #1ed760 !important;
}

.modalDark .sliderValueBadge {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
}

.modalDark .stepperBtn {
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.modalDark .stepperBtn:hover {
  background: #ffffff !important;
  color: #121214 !important;
}
`;

normCss += '\n' + themeOverrides;

fs.writeFileSync(cssPath, normCss.replace(/\n/g, '\r\n'), 'utf8');
console.log("SettingsModal.module.css successfully updated!");
