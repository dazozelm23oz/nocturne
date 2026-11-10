const fs = require('fs');

// 1. Patch AppleMusicSettingsModal.tsx
{
  const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8').replace(/\r\n/g, '\n');

  const oldThemeVars = `    if (isAutoTheme && previewPalette) {
      const primary = previewPalette.primary || "#1db954";
      const rgb = getRgbFromColor(primary);
      const isLightAccent = Boolean(previewPalette.isLight);
      const contrast = isLightAccent ? "#111113" : "#ffffff";
      const glow = previewPalette.glow || \`rgba(\${rgb}, 0.45)\`;

      const modalWindowBg = previewPalette.overlayGradient
        ? \`linear-gradient(145deg, rgba(18, 18, 22, \${glassOpacity}), rgba(10, 10, 14, \${Math.min(1, glassOpacity + 0.08)})), \${previewPalette.overlayGradient}\`
        : \`rgba(18, 18, 22, \${glassOpacity})\`;

      return {
        "--palette-primary": primary,
        "--palette-primary-rgb": rgb,
        "--palette-contrast": contrast,
        "--palette-glow": glow,
        "--modal-backdrop-blur": \`\${glassBlur}px\`,
        "--modal-window-bg": modalWindowBg,
        "--modal-header-bg": \`rgba(\${rgb}, \${Math.min(0.25, Math.max(0.08, glassOpacity * 0.18))})\`,
        "--modal-border": \`rgba(\${rgb}, 0.28)\`,
        "--modal-text": isLightAccent ? "#111113" : "#ffffff",
        "--modal-text-dim": isLightAccent ? "rgba(20, 20, 24, 0.65)" : "rgba(255, 255, 255, 0.68)",
        "--modal-title-color": primary,
        "--btn-neutral-bg": \`rgba(\${rgb}, 0.12)\`,
        "--btn-neutral-border": \`rgba(\${rgb}, 0.25)\`,
        "--btn-neutral-hover": \`rgba(\${rgb}, 0.24)\`,
        "--btn-neutral-color": isLightAccent ? "#111113" : "#ffffff",
      } as React.CSSProperties;
    }`;

  const newThemeVars = `    if (isAutoTheme && previewPalette) {
      const m3 = previewPalette.m3;
      const primary = m3?.primary || previewPalette.primary || "#1db954";
      const rgb = m3?.primaryRgb || getRgbFromColor(primary);
      const isLightAccent = Boolean(previewPalette.isLight);
      const contrast = m3?.onPrimary || (isLightAccent ? "#111113" : "#ffffff");
      const glow = m3?.glow || previewPalette.glow || \`rgba(\${rgb}, 0.45)\`;

      const surfaceRgb = m3?.surfaceRgb || "18, 18, 22";
      const surfaceContainerRgb = m3?.surfaceContainerRgb || "26, 26, 32";
      const outlineRgb = m3?.outlineRgb || rgb;
      const onSurface = m3?.onSurface || (isLightAccent ? "#111113" : "#ffffff");
      const onSurfaceVariant = m3?.onSurfaceVariant || (isLightAccent ? "rgba(20, 20, 24, 0.65)" : "rgba(255, 255, 255, 0.68)");

      const modalWindowBg = previewPalette.overlayGradient
        ? \`linear-gradient(145deg, rgba(\${surfaceRgb}, \${glassOpacity}), rgba(10, 10, 14, \${Math.min(1, glassOpacity + 0.08)})), \${previewPalette.overlayGradient}\`
        : \`rgba(\${surfaceRgb}, \${glassOpacity})\`;

      return {
        "--palette-primary": primary,
        "--palette-primary-rgb": rgb,
        "--palette-contrast": contrast,
        "--palette-glow": glow,
        "--modal-backdrop-blur": \`\${glassBlur}px\`,
        "--modal-window-bg": modalWindowBg,
        "--modal-header-bg": \`rgba(\${surfaceRgb}, \${Math.min(0.96, glassOpacity + 0.12)})\`,
        "--modal-card-bg": \`rgba(\${surfaceContainerRgb}, 0.42)\`,
        "--modal-card-border": \`rgba(\${outlineRgb}, 0.24)\`,
        "--modal-border": \`rgba(\${outlineRgb}, 0.28)\`,
        "--modal-text": onSurface,
        "--modal-text-dim": onSurfaceVariant,
        "--modal-title-color": primary,
        "--btn-neutral-bg": \`rgba(\${rgb}, 0.12)\`,
        "--btn-neutral-border": \`rgba(\${outlineRgb}, 0.24)\`,
        "--btn-neutral-hover": \`rgba(\${rgb}, 0.22)\`,
        "--btn-neutral-color": onSurface,
      } as React.CSSProperties;
    }`;

  if (!modalContent.includes(oldThemeVars)) {
    console.error("oldThemeVars not found in AppleMusicSettingsModal.tsx!");
    process.exit(1);
  }

  modalContent = modalContent.replace(oldThemeVars, newThemeVars);

  // Update slider labels to Interface Opacity & Backdrop Blur Intensity
  const oldBlurLabel = `<h3 className={styles.settingName}>Modal Glass Backdrop Blur</h3>
                <span className={styles.settingDesc}>
                  Adjust background blur radius (higher for softer frosted glass)
                </span>`;
  const newBlurLabel = `<h3 className={styles.settingName}>Backdrop Blur Intensity</h3>
                <span className={styles.settingDesc}>
                  Adjust frosted glass background blur behind settings (0px for clear, 60px for deep blur)
                </span>`;

  const oldOpacityLabel = `<h3 className={styles.settingName}>Modal Transparency & Opacity</h3>
                <span className={styles.settingDesc}>
                  Adjust background translucency (lower for transparent frosted glass)
                </span>`;
  const newOpacityLabel = `<h3 className={styles.settingName}>Interface Opacity</h3>
                <span className={styles.settingDesc}>
                  Adjust UI surface translucency (0% for pure transparent glass, 100% for solid surface)
                </span>`;

  if (modalContent.includes(oldBlurLabel)) {
    modalContent = modalContent.replace(oldBlurLabel, newBlurLabel);
  }
  if (modalContent.includes(oldOpacityLabel)) {
    modalContent = modalContent.replace(oldOpacityLabel, newOpacityLabel);
  }

  fs.writeFileSync(modalPath, modalContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log("AppleMusicSettingsModal.tsx patched with M3 tonal vars and refined sliders!");
}

// 2. Patch SettingsModal.module.css
{
  const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
  let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

  // Update categoryTabsContainer & categoryTab to Riff pill aesthetic
  const oldTabs = `/* Category Navigation Tabs Grid - Equal 6-column distribution */
.categoryTabsContainer {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 5px;
  height: 48px;
  min-height: 48px;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
}

.categoryTab {
  width: 100%;
  height: 38px;
  min-height: 38px;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 4px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--btn-neutral-color, rgba(255, 255, 255, 0.7));
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}`;

  const newTabs = `/* Category Navigation Tabs Grid - Riff Material 3 Pill Capsule Bar */
.categoryTabsContainer {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.1));
  border-radius: 9999px;
  padding: 4px;
  height: 46px;
  min-height: 46px;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
}

.categoryTab {
  width: 100%;
  height: 36px;
  min-height: 36px;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--btn-neutral-color, rgba(255, 255, 255, 0.7));
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}`;

  if (css.includes(oldTabs)) {
    css = css.replace(oldTabs, newTabs);
    console.log("categoryTabs updated to Riff M3 pills!");
  }

  // Update .settingRow to use Material 3 cards
  const oldRow = `.settingRow {
  background: #181818;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s ease;
  position: relative;
}`;

  const newRow = `.settingRow {
  background: var(--modal-card-bg, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--modal-card-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.18s ease;
  position: relative;
}

.settingRow:hover {
  background: var(--btn-neutral-hover, rgba(255, 255, 255, 0.08));
  border-color: var(--palette-primary, rgba(255, 255, 255, 0.18));
}`;

  if (css.includes(oldRow)) {
    css = css.replace(oldRow, newRow);
    console.log(".settingRow updated to Material 3 cards!");
  }

  fs.writeFileSync(cssPath, css.replace(/\n/g, '\r\n'), 'utf8');
  console.log("SettingsModal.module.css updated!");
}
