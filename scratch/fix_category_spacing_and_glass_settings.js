const fs = require('fs');

// =========================================================================
// 1. UPDATE styles/SettingsModal.module.css
// =========================================================================
let css = fs.readFileSync('styles/SettingsModal.module.css', 'utf8');

// Update .modalOverlay to softer dark with blur
css = css.replace(
  /\.modalOverlay\s*\{[\s\S]*?animation:\s*fadeIn\s*0\.2s\s*ease-out;\s*\}/,
`.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.2s ease-out;
}`
);

// Update .modalWindow with dynamic backdrop-filter blur and translucent background
css = css.replace(
  /\.modalWindow\s*\{[\s\S]*?color:\s*#ffffff;\s*\}/,
`.modalWindow {
  background: var(--modal-window-bg, rgba(18, 18, 22, 0.75));
  backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid var(--modal-border, rgba(255, 255, 255, 0.12));
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--modal-text, #ffffff);
  transition: backdrop-filter 0.2s ease, -webkit-backdrop-filter 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}`
);

// Update .modalHeader
css = css.replace(
  /\.modalHeader\s*\{[\s\S]*?border-bottom:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.06\);\s*\}/,
`.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px 28px;
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
  -webkit-backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
}`
);

// Update .categoryNavHeader and insert base categoryTabsContainer
const oldCategoryNavHeader = /\.categoryNavHeader\s*\{[\s\S]*?box-sizing:\s*border-box;\s*\}/;
const newCategoryNavHeaderWithTabs = `.categoryNavHeader {
  flex-shrink: 0;
  padding: 12px 20px 10px 20px;
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  z-index: 15;
  box-sizing: border-box;
  backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
  -webkit-backdrop-filter: blur(calc(var(--modal-backdrop-blur, 28px) * 0.75));
}

/* Category Navigation Tabs Grid - Equal 5-column distribution */
.categoryTabsContainer {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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
}

.categoryTab:hover {
  color: var(--modal-text, #ffffff);
  background: var(--btn-neutral-hover, rgba(255, 255, 255, 0.12));
}

.categoryTabActive {
  background: var(--palette-primary, rgba(255, 255, 255, 0.22)) !important;
  color: var(--palette-contrast, #ffffff) !important;
  box-shadow: 0 2px 12px var(--palette-glow, rgba(0, 0, 0, 0.35));
  font-weight: 700 !important;
}

.categoryTabLabel {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.tabLabelFull {
  display: inline;
}

.tabLabelShort {
  display: none;
}

@media (max-width: 1350px) {
  .tabLabelFull {
    display: none;
  }
  .tabLabelShort {
    display: inline;
  }
}

.windowSplit .tabLabelFull,
.windowDocked .tabLabelFull {
  display: none;
}
.windowSplit .tabLabelShort,
.windowDocked .tabLabelShort {
  display: inline;
}

.sliderValueBadge {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--palette-primary, #1ed760);
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.1));
}`;

css = css.replace(oldCategoryNavHeader, newCategoryNavHeaderWithTabs);

fs.writeFileSync('styles/SettingsModal.module.css', css, 'utf8');
console.log('Successfully updated styles/SettingsModal.module.css!');

// =========================================================================
// 2. UPDATE components/AppleMusicSettingsModal.tsx
// =========================================================================
let modalCode = fs.readFileSync('components/AppleMusicSettingsModal.tsx', 'utf8');

// Update modalThemeVars to use settings.modalGlassBlur and settings.modalGlassOpacity
const oldThemeVarsRegex = /const modalThemeVars = useMemo\(\(\) => \{[\s\S]*?\}, \[isLightMode, isAutoTheme, previewPalette\]\);/;

const newThemeVars = `const modalThemeVars = useMemo(() => {
    const glassBlur = settings.modalGlassBlur ?? 28;
    const glassOpacity = Math.max(0.2, Math.min(1.0, (settings.modalGlassOpacity ?? 75) / 100));

    if (isLightMode) {
      return {
        "--modal-backdrop-blur": \`\${glassBlur}px\`,
        "--modal-window-bg": \`rgba(248, 248, 250, \${glassOpacity})\`,
        "--modal-header-bg": \`rgba(242, 242, 247, \${Math.min(0.96, glassOpacity + 0.08)})\`,
        "--modal-border": "rgba(0, 0, 0, 0.1)",
        "--modal-text": "#111113",
        "--modal-text-dim": "rgba(20, 20, 24, 0.6)",
        "--btn-neutral-bg": "rgba(0, 0, 0, 0.05)",
        "--btn-neutral-border": "rgba(0, 0, 0, 0.08)",
        "--btn-neutral-hover": "rgba(0, 0, 0, 0.09)",
        "--btn-neutral-color": "rgba(20, 20, 24, 0.75)",
        "--palette-primary": "#0071e3",
        "--palette-contrast": "#ffffff",
        "--palette-glow": "rgba(0, 113, 227, 0.3)",
      } as React.CSSProperties;
    }

    if (isAutoTheme && previewPalette) {
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
        "--modal-header-bg": \`rgba(\${rgb}, \${Math.min(0.2, glassOpacity * 0.15)})\`,
        "--modal-border": \`rgba(\${rgb}, 0.28)\`,
        "--modal-text": "#ffffff",
        "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
        "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
        "--btn-neutral-border": \`rgba(\${rgb}, 0.2)\`,
        "--btn-neutral-hover": "rgba(255, 255, 255, 0.15)",
        "--btn-neutral-color": "rgba(255, 255, 255, 0.8)",
      } as React.CSSProperties;
    }

    // Dark Theme default
    return {
      "--modal-backdrop-blur": \`\${glassBlur}px\`,
      "--modal-window-bg": \`rgba(18, 18, 22, \${glassOpacity})\`,
      "--modal-header-bg": \`rgba(22, 22, 26, \${Math.min(0.96, glassOpacity + 0.1)})\`,
      "--modal-border": "rgba(255, 255, 255, 0.1)",
      "--modal-text": "#ffffff",
      "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
      "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-border": "rgba(255, 255, 255, 0.1)",
      "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
      "--btn-neutral-color": "rgba(255, 255, 255, 0.75)",
      "--palette-primary": "#1ed760",
      "--palette-contrast": "#ffffff",
      "--palette-glow": "rgba(30, 215, 96, 0.4)",
    } as React.CSSProperties;
  }, [isLightMode, isAutoTheme, previewPalette, settings.modalGlassBlur, settings.modalGlassOpacity]);`;

modalCode = modalCode.replace(oldThemeVarsRegex, newThemeVars);

// Update Category Tabs markup in AppleMusicSettingsModal.tsx
const oldTabsRegex = /<div className=\{styles\.categoryTabsContainer\}>[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Scrollable Settings Content Body \*\//;

const newTabsMarkup = `<div className={styles.categoryTabsContainer}>
                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "all" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("all")}
                  title="All Settings"
                >
                  <GruvboxIcon name="magic" size={14} />
                  <span className={styles.categoryTabLabel}>All</span>
                </button>
                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "appearance" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("appearance")}
                  title="Appearance & Themes"
                >
                  <GruvboxIcon name="palette" size={14} />
                  <span className={styles.categoryTabLabel}>Appearance</span>
                </button>
                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "lyrics" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("lyrics")}
                  title="Lyrics & Typography"
                >
                  <GruvboxIcon name="chat" size={14} />
                  <span className={styles.categoryTabLabel}>Lyrics</span>
                </button>
                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "visuals" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("visuals")}
                  title="Visual Effects"
                >
                  <GruvboxIcon name="waves" size={14} />
                  <span className={styles.categoryTabLabel}>
                    <span className={styles.tabLabelFull}>Visual Effects</span>
                    <span className={styles.tabLabelShort}>Visuals</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "playback" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("playback")}
                  title="Playback & System"
                >
                  <GruvboxIcon name="gear" size={14} />
                  <span className={styles.categoryTabLabel}>
                    <span className={styles.tabLabelFull}>Playback & System</span>
                    <span className={styles.tabLabelShort}>Playback</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Settings Content Body */`;

modalCode = modalCode.replace(oldTabsRegex, newTabsMarkup);

// Add Modal Glass Blur & Window Opacity Sliders under Appearance & Themes
const themeRowEnd = `<div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Theme</h3>
                <span className={styles.settingDesc}>
                  Select Dark Mode, Light Mode, or Auto (matches album palette)
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>`;

const glassControls = `          {/* Modal Glass Blur Slider */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <GruvboxIcon name="waves" size={18} />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Modal Glass Blur</h3>
                <span className={styles.settingDesc}>
                  Frosted glass backdrop blur intensity of the settings box
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ width: "240px" }}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.max(0, (prev.modalGlassBlur ?? 28) - 4),
                    }))
                  }
                  title="Decrease Glass Blur"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={settings.modalGlassBlur ?? 28}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassBlur: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Glass Blur: \${settings.modalGlassBlur ?? 28}px\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) >= 60}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.min(60, (prev.modalGlassBlur ?? 28) + 4),
                    }))
                  }
                  title="Increase Glass Blur"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassBlur ?? 28}px
                </span>
              </div>
            </div>
          </div>

          {/* Modal Window Opacity Slider */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <GruvboxIcon name="palette" size={18} />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Modal Transparency & Opacity</h3>
                <span className={styles.settingDesc}>
                  Adjust background translucency (lower for transparent frosted glass)
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ width: "240px" }}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) <= 20}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.max(20, (prev.modalGlassOpacity ?? 75) - 5),
                    }))
                  }
                  title="Decrease Opacity"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={settings.modalGlassOpacity ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassOpacity: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${(((settings.modalGlassOpacity ?? 75) - 20) / 80) * 100}%, rgba(255, 255, 255, 0.18) \${(((settings.modalGlassOpacity ?? 75) - 20) / 80) * 100}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Window Opacity: \${settings.modalGlassOpacity ?? 75}%\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) >= 100}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.min(100, (prev.modalGlassOpacity ?? 75) + 5),
                    }))
                  }
                  title="Increase Opacity"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassOpacity ?? 75}%
                </span>
              </div>
            </div>
          </div>\n\n` + themeRowEnd;

if (modalCode.includes(themeRowEnd)) {
  modalCode = modalCode.replace(themeRowEnd, glassControls);
} else {
  // CRLF fallback
  modalCode = modalCode.replace(themeRowEnd.replace(/\n/g, '\r\n'), glassControls.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('components/AppleMusicSettingsModal.tsx', modalCode, 'utf8');
console.log('Successfully updated components/AppleMusicSettingsModal.tsx!');
