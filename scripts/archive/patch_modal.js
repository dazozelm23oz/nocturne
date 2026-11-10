const fs = require('fs');
const filePath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `  const modalThemeVars = useMemo(() => {
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
    } as React.CSSProperties;`;

const replacement1 = `  const modalThemeVars = useMemo(() => {
    const glassBlur = settings.modalGlassBlur ?? 28;
    const glassOpacity = Math.max(0.0, Math.min(1.0, (settings.modalGlassOpacity ?? 75) / 100));

    if (isLightMode) {
      return {
        "--modal-backdrop-blur": \`\${glassBlur}px\`,
        "--modal-window-bg": \`rgba(248, 248, 250, \${glassOpacity})\`,
        "--modal-header-bg": \`rgba(242, 242, 247, \${Math.min(0.96, glassOpacity + 0.08)})\`,
        "--modal-border": "rgba(0, 0, 0, 0.1)",
        "--modal-text": "#111113",
        "--modal-text-dim": "rgba(20, 20, 24, 0.6)",
        "--modal-title-color": "#111113",
        "--btn-neutral-bg": "rgba(0, 0, 0, 0.05)",
        "--btn-neutral-border": "rgba(0, 0, 0, 0.08)",
        "--btn-neutral-hover": "rgba(0, 0, 0, 0.09)",
        "--btn-neutral-color": "rgba(20, 20, 24, 0.75)",
        "--palette-primary": "#0071e3",
        "--palette-primary-rgb": "0, 113, 227",
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
    }

    // Dark Theme default
    return {
      "--modal-backdrop-blur": \`\${glassBlur}px\`,
      "--modal-window-bg": \`rgba(18, 18, 22, \${glassOpacity})\`,
      "--modal-header-bg": \`rgba(22, 22, 26, \${Math.min(0.96, glassOpacity + 0.1)})\`,
      "--modal-border": "rgba(255, 255, 255, 0.1)",
      "--modal-text": "#ffffff",
      "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
      "--modal-title-color": "#ffffff",
      "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-border": "rgba(255, 255, 255, 0.1)",
      "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
      "--btn-neutral-color": "rgba(255, 255, 255, 0.75)",
      "--palette-primary": "#1ed760",
      "--palette-primary-rgb": "30, 215, 96",
      "--palette-contrast": "#000000",
      "--palette-glow": "rgba(30, 215, 96, 0.4)",
    } as React.CSSProperties;`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget1 = target1.replace(/\r\n/g, '\n');
const normalizedReplacement1 = replacement1.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedTarget1)) {
  console.error("Target1 not found!");
  process.exit(1);
}

let patched = normalizedContent.replace(normalizedTarget1, normalizedReplacement1);

// Now patch the header controls and SVG icons
const targetHeader = `        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <h1 className={styles.modalTitle}>Nocturne Studio</h1>
          </div>

          <div className={styles.headerControls}>
            {/* View Mode Switcher */}
            <div className={styles.viewModeSwitcher}>
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Split Studio: Interactive lyrics preview & settings"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
                <span>Split Studio</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("docked")}
                title="Dock Left: Pinned compact side drawer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="3" y="3" width="7" height="18" fill="currentColor" fillOpacity="0.4" />
                </svg>
                <span>Dock Left</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("centered")}
                title="Dialog: Centered single window modal"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Dialog</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={styles.previewToggleBtn}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showLivePreview: prev.showLivePreview === false ? true : false,
                  }))
                }
                title={settings.showLivePreview !== false ? "Hide Live Preview (Full Width Settings)" : "Show Live Preview"}
              >
                <GruvboxIcon name={settings.showLivePreview !== false ? "close" : "image"} size={12} />
                <span>{settings.showLivePreview !== false ? "Hide Preview" : "Show Preview"}</span>
              </button>
            )}

            {/* Repositioned Sleek Circular Close Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close"
            >
              <GruvboxIcon name="close" size={13} />
            </button>
          </div>
        </div>`;

const replacementHeader = `        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <h1 className={styles.modalTitle}>
              <span>Nocturne Studio</span>
              <span className={styles.studioHeaderBadge}>
                {viewMode === "split" ? "Split Studio" : viewMode === "docked" ? "Dock Left" : "Dialog"}
              </span>
            </h1>
          </div>

          <div className={styles.headerControls}>
            {/* View Mode Switcher Capsule */}
            <div className={styles.viewModeSwitcher} role="group" aria-label="Layout View Modes">
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Split Studio: Interactive lyrics preview & settings"
              >
                <GruvboxIcon name="split" size={13} />
                <span>Split Studio</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("docked")}
                title="Dock Left: Pinned compact side drawer"
              >
                <GruvboxIcon name="dock" size={13} />
                <span>Dock Left</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("centered")}
                title="Dialog: Centered single window modal"
              >
                <GruvboxIcon name="dialog" size={13} />
                <span>Dialog</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={\`\${styles.previewToggleBtn} \${settings.showLivePreview === false ? styles.previewToggleOff : ""}\`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showLivePreview: prev.showLivePreview === false ? true : false,
                  }))
                }
                title={settings.showLivePreview !== false ? "Hide Live Preview (Full Width Settings)" : "Show Live Preview"}
              >
                <GruvboxIcon name={settings.showLivePreview !== false ? "close" : "image"} size={12} />
                <span>{settings.showLivePreview !== false ? "Hide Preview" : "Show Preview"}</span>
              </button>
            )}

            <div className={styles.headerDivider} />

            {/* Repositioned Sleek Circular Close Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close"
            >
              <GruvboxIcon name="close" size={13} />
            </button>
          </div>
        </div>`;

const normalizedTargetHeader = targetHeader.replace(/\r\n/g, '\n');
const normalizedReplacementHeader = replacementHeader.replace(/\r\n/g, '\n');

if (!patched.includes(normalizedTargetHeader)) {
  console.error("TargetHeader not found!");
  process.exit(1);
}

patched = patched.replace(normalizedTargetHeader, normalizedReplacementHeader);

fs.writeFileSync(filePath, patched.replace(/\n/g, '\r\n'), 'utf8');
console.log("AppleMusicSettingsModal.tsx successfully patched!");
