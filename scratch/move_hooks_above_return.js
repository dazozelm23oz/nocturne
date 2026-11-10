const fs = require('fs');

let code = fs.readFileSync('components/AppleMusicSettingsModal.tsx', 'utf8');

// 1. Extract getRgbFromColor and modalThemeVars
const themeVarsBlock = `  // Dynamic RGB extraction helper
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

  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";
  const isLightMode =
    settings.theme === "Light" ||
    (isAutoTheme && Boolean(previewPalette?.isLight));

  const modalThemeVars = useMemo(() => {
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

// Remove the old definitions from below
const oldDefinitionsRegex = /\/\/ Dynamic RGB extraction helper[\s\S]*?\}, \[isLightMode, isAutoTheme, previewPalette, settings\.modalGlassBlur, settings\.modalGlassOpacity\]\);/;
code = code.replace(oldDefinitionsRegex, '');

// Also remove duplicate isAutoTheme / isLightMode if present later
code = code.replace(
  /const isAutoTheme = \(settings\.theme \|\| "Auto \(Album Art\)"\) === "Auto \(Album Art\)";\s*const isLightMode =\s*settings\.theme === "Light" \|\|\s*\(isAutoTheme && Boolean\(previewPalette\?\.isLight\)\);/,
  ''
);

// Insert themeVarsBlock right before if (!isOpen) return null;
const target = 'if (!isOpen) return null;';
code = code.replace(target, themeVarsBlock + '\n\n  ' + target);

fs.writeFileSync('components/AppleMusicSettingsModal.tsx', code, 'utf8');
console.log('Successfully moved modalThemeVars above if (!isOpen) return null; to fix Rules of Hooks!');
