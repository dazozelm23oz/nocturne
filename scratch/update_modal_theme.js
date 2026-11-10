const fs = require('fs');
const path = require('path');

const modalPath = path.join(__dirname, '..', 'components', 'AppleMusicSettingsModal.tsx');
let code = fs.readFileSync(modalPath, 'utf8');

// 1. Add parseRgbString helper before interface SettingsModalProps
const helper = `function parseRgbString(colorStr?: string): string {
  if (!colorStr) return "29, 185, 84";
  if (colorStr.startsWith("rgb")) {
    const nums = colorStr.match(/\\d+/g);
    if (nums && nums.length >= 3) {
      return \`\${nums[0]}, \${nums[1]}, \${nums[2]}\`;
    }
  }
  if (colorStr.startsWith("#")) {
    const hex = colorStr.replace("#", "");
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ].join(", ");
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ].join(", ");
    }
  }
  return "29, 185, 84";
}

`;

if (!code.includes('function parseRgbString')) {
  code = code.replace('interface SettingsModalProps {', helper + 'interface SettingsModalProps {');
}

// 2. Add paletteColors to SettingsModalProps
if (!code.includes('paletteColors?: PaletteColors | null;')) {
  code = code.replace('songImage?: string;', 'songImage?: string;\n  paletteColors?: PaletteColors | null;');
}

// 3. Add paletteColors to props of AppleMusicSettingsModal
if (!code.includes('paletteColors,')) {
  code = code.replace(/songImage,(\r?\n\s*)lyrics,/, 'songImage,$1paletteColors,$1lyrics,');
}

// 4. Initialize previewPalette with paletteColors || null and add sync useEffect
const paletteInitOld = 'const [previewPalette, setPreviewPalette] = useState<PaletteColors | null>(null);';
const paletteInitNew = `const [previewPalette, setPreviewPalette] = useState<PaletteColors | null>(paletteColors || null);
  useEffect(() => {
    if (paletteColors) {
      setPreviewPalette(paletteColors);
    }
  }, [paletteColors]);`;

if (code.includes(paletteInitOld)) {
  code = code.replace(paletteInitOld, paletteInitNew);
}

// 5. Update modalThemeClass and modalThemeVars
const oldThemeBlock = `  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";
  const isLightMode =
    settings.theme === "Light" ||
    (isAutoTheme && Boolean(previewPalette?.isLight));`;

const newThemeBlock = `  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";
  const isDarkTheme = settings.theme === "Dark";
  const isLightTheme = settings.theme === "Light";
  const isPaletteLight = Boolean(previewPalette?.isLight);
  const isLightMode = isLightTheme || (isAutoTheme && isPaletteLight);

  const modalThemeClass = isLightTheme
    ? styles.modalLight
    : isDarkTheme
    ? styles.modalDark
    : styles.modalAuto;

  const modalThemeVars = useMemo<React.CSSProperties>(() => {
    if (isLightTheme) {
      return {
        "--modal-theme": "light",
        "--palette-primary": "#0071e3",
        "--palette-primary-rgb": "0, 113, 227",
        "--palette-contrast": "#ffffff",
        "--palette-glow": "rgba(0, 113, 227, 0.25)",
        "--modal-window-bg": "rgba(248, 248, 250, 0.98)",
        "--modal-header-bg": "rgba(248, 248, 250, 0.96)",
        "--modal-border": "rgba(0, 0, 0, 0.1)",
        "--modal-text": "#111113",
        "--modal-text-dim": "rgba(20, 20, 24, 0.6)",
        "--btn-neutral-bg": "rgba(0, 0, 0, 0.05)",
        "--btn-neutral-hover": "rgba(0, 0, 0, 0.09)",
        "--btn-neutral-border": "rgba(0, 0, 0, 0.08)",
        "--btn-neutral-color": "rgba(20, 20, 24, 0.75)",
        "--btn-active-bg": "#ffffff",
        "--btn-active-color": "#111113",
        "--btn-active-shadow": "0 2px 8px rgba(0, 0, 0, 0.12)",
      } as React.CSSProperties;
    }

    if (isDarkTheme) {
      return {
        "--modal-theme": "dark",
        "--palette-primary": "#1db954",
        "--palette-primary-rgb": "29, 185, 84",
        "--palette-contrast": "#ffffff",
        "--palette-glow": "rgba(29, 185, 84, 0.35)",
        "--modal-window-bg": "#121214",
        "--modal-header-bg": "rgba(18, 18, 20, 0.96)",
        "--modal-border": "rgba(255, 255, 255, 0.08)",
        "--modal-text": "#ffffff",
        "--modal-text-dim": "rgba(255, 255, 255, 0.65)",
        "--btn-neutral-bg": "rgba(255, 255, 255, 0.08)",
        "--btn-neutral-hover": "rgba(255, 255, 255, 0.14)",
        "--btn-neutral-border": "rgba(255, 255, 255, 0.08)",
        "--btn-neutral-color": "rgba(255, 255, 255, 0.7)",
        "--btn-active-bg": "rgba(255, 255, 255, 0.22)",
        "--btn-active-color": "#ffffff",
        "--btn-active-shadow": "0 2px 8px rgba(0, 0, 0, 0.35)",
      } as React.CSSProperties;
    }

    // AUTO (Album Art / Palette Theme)
    const primary = previewPalette?.primary || "#1db954";
    const primaryRgb = parseRgbString(primary);
    const glow = previewPalette?.glow || "rgba(29, 185, 84, 0.4)";
    const contrast = isPaletteLight ? "#111113" : "#ffffff";
    const overlayGradient =
      previewPalette?.overlayGradient ||
      \`radial-gradient(circle at 35% 50%, rgba(\${primaryRgb}, 0.28) 0%, rgba(12, 12, 16, 0.92) 100%)\`;

    const windowBg = isPaletteLight
      ? \`radial-gradient(circle at 85% 15%, \${glow} 0%, rgba(248, 248, 250, 0.95) 65%), #f8f8fa\`
      : \`radial-gradient(circle at 85% 15%, \${glow} 0%, rgba(18, 18, 24, 0.88) 60%), \${overlayGradient}, #121216\`;

    const headerBg = isPaletteLight
      ? "rgba(248, 248, 250, 0.92)"
      : "rgba(18, 18, 22, 0.88)";

    return {
      "--modal-theme": "auto",
      "--palette-primary": primary,
      "--palette-primary-rgb": primaryRgb,
      "--palette-contrast": contrast,
      "--palette-glow": glow,
      "--modal-window-bg": windowBg,
      "--modal-header-bg": headerBg,
      "--modal-border": \`rgba(\${primaryRgb}, 0.24)\`,
      "--modal-text": isPaletteLight ? "#111113" : "#ffffff",
      "--modal-text-dim": isPaletteLight ? "rgba(20, 20, 24, 0.65)" : "rgba(255, 255, 255, 0.68)",
      "--btn-neutral-bg": \`rgba(\${primaryRgb}, 0.09)\`,
      "--btn-neutral-hover": \`rgba(\${primaryRgb}, 0.16)\`,
      "--btn-neutral-border": \`rgba(\${primaryRgb}, 0.2)\`,
      "--btn-neutral-color": isPaletteLight ? "rgba(20, 20, 24, 0.75)" : "rgba(255, 255, 255, 0.75)",
      "--btn-active-bg": primary,
      "--btn-active-color": contrast,
      "--btn-active-shadow": \`0 2px 14px \${glow}\`,
    } as React.CSSProperties;
  }, [isLightTheme, isDarkTheme, previewPalette, isPaletteLight]);`;

if (code.includes(oldThemeBlock)) {
  code = code.replace(oldThemeBlock, newThemeBlock);
}

// 6. Update className and style of modalWindow
const oldModalWindowTag = `        className={\`\${styles.modalWindow} \${
          viewMode === "split"
            ? styles.windowSplit
            : viewMode === "docked"
            ? styles.windowDocked
            : ""
        } \${isLightMode ? styles.modalLight : ""}\`}`;

const newModalWindowTag = `        className={\`\${styles.modalWindow} \${
          viewMode === "split"
            ? styles.windowSplit
            : viewMode === "docked"
            ? styles.windowDocked
            : ""
        } \${modalThemeClass}\`}
        style={modalThemeVars}`;

if (code.includes(oldModalWindowTag)) {
  code = code.replace(oldModalWindowTag, newModalWindowTag);
}

fs.writeFileSync(modalPath, code, 'utf8');
console.log('AppleMusicSettingsModal.tsx updated successfully');
