const fs = require('fs');

// 1. Update components/AppleMusicSettingsModal.tsx
let modalCode = fs.readFileSync('components/AppleMusicSettingsModal.tsx', 'utf8');

// Insert getRgbFromColor and modalThemeVars before the return statement
const insertAnchor = '  return (\n    <div\n      className={`${styles.modalOverlay}';
const insertContent = `  // Dynamic RGB extraction helper
  const getRgbFromColor = (colorStr?: string): string => {
    if (!colorStr) return "29, 185, 84";
    if (colorStr.startsWith("#")) {
      const hex = colorStr.replace("#", "");
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return \`\${r}, \${g}, \${b}\`;
      } else if (hex.length >= 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return \`\${r}, \${g}, \${b}\`;
      }
    } else if (colorStr.startsWith("rgb")) {
      const match = colorStr.match(/(\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (match) return \`\${match[1]}, \${match[2]}, \${match[3]}\`;
    }
    return "29, 185, 84";
  };

  const modalThemeVars = useMemo(() => {
    if (isLightMode) {
      return {} as React.CSSProperties;
    }
    if (isAutoTheme && previewPalette) {
      const primary = previewPalette.primary || "#1db954";
      const rgb = getRgbFromColor(primary);
      const isLightAccent = Boolean(previewPalette.isLight);
      const contrast = isLightAccent ? "#111113" : "#ffffff";
      const glow = previewPalette.glow || \`rgba(\${rgb}, 0.45)\`;

      return {
        "--palette-primary": primary,
        "--palette-primary-rgb": rgb,
        "--palette-contrast": contrast,
        "--palette-glow": glow,
        "--modal-window-bg": previewPalette.overlayGradient
          ? \`linear-gradient(145deg, rgba(18, 18, 22, 0.94), rgba(12, 12, 14, 0.97)), \${previewPalette.overlayGradient}\`
          : "rgba(18, 18, 22, 0.96)",
        "--modal-header-bg": \`rgba(\${rgb}, 0.08)\`,
        "--modal-border": \`rgba(\${rgb}, 0.22)\`,
        "--modal-text": "#ffffff",
        "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
        "--btn-neutral-bg": "rgba(255, 255, 255, 0.07)",
        "--btn-neutral-border": \`rgba(\${rgb}, 0.18)\`,
        "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
        "--btn-neutral-color": "rgba(255, 255, 255, 0.8)",
      } as React.CSSProperties;
    }
    // Dark Theme default
    return {
      "--modal-window-bg": "#121214",
      "--modal-header-bg": "rgba(18, 18, 20, 0.96)",
      "--modal-border": "rgba(255, 255, 255, 0.08)",
      "--modal-text": "#ffffff",
      "--modal-text-dim": "rgba(255, 255, 255, 0.6)",
      "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-border": "rgba(255, 255, 255, 0.08)",
      "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
      "--btn-neutral-color": "rgba(255, 255, 255, 0.75)",
    } as React.CSSProperties;
  }, [isLightMode, isAutoTheme, previewPalette]);\n\n` + insertAnchor;

if (modalCode.includes(insertAnchor)) {
  modalCode = modalCode.replace(insertAnchor, insertContent);
} else {
  // Try CRLF
  const insertAnchorCRLF = '  return (\r\n    <div\r\n      className={`${styles.modalOverlay}';
  modalCode = modalCode.replace(insertAnchorCRLF, insertContent.replace(/\n/g, '\r\n'));
}

// Replace className={`${styles.modalWindow} ... ${isLightMode ? styles.modalLight : ""}`}
const oldWindowDiv = `      <div
        className={\`\${styles.modalWindow} \${
          viewMode === "split"
            ? styles.windowSplit
            : viewMode === "docked"
            ? styles.windowDocked
            : ""
        } \${isLightMode ? styles.modalLight : ""}\`}`;

const newWindowDiv = `      <div
        className={\`\${styles.modalWindow} \${
          viewMode === "split"
            ? styles.windowSplit
            : viewMode === "docked"
            ? styles.windowDocked
            : ""
        } \${isLightMode ? styles.modalLight : isAutoTheme ? styles.modalAuto : styles.modalDark}\`}
        style={modalThemeVars}`;

if (modalCode.includes(oldWindowDiv)) {
  modalCode = modalCode.replace(oldWindowDiv, newWindowDiv);
} else {
  modalCode = modalCode.replace(oldWindowDiv.replace(/\n/g, '\r\n'), newWindowDiv.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('components/AppleMusicSettingsModal.tsx', modalCode, 'utf8');
console.log('Successfully updated AppleMusicSettingsModal.tsx with modalAuto/modalDark and style={modalThemeVars}!');

// 2. Update styles/SettingsModal.module.css to add .splitContentContainer
let css = fs.readFileSync('styles/SettingsModal.module.css', 'utf8');
if (!css.includes('.splitContentContainer')) {
  css = css.replace(
    '.settingsPane {',
`.splitContentContainer {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.settingsPane {`
  );
  fs.writeFileSync('styles/SettingsModal.module.css', css, 'utf8');
  console.log('Successfully added .splitContentContainer to SettingsModal.module.css!');
} else {
  console.log('.splitContentContainer already exists in SettingsModal.module.css');
}
