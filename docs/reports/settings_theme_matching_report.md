# Settings Modal Theme Matching Suite & Color System

## 1. Executive Summary
This document covers the comprehensive architectural update to the Settings Modal (`components/AppleMusicSettingsModal.tsx` and `styles/SettingsModal.module.css`), ensuring that the modal background, category tabs, view mode controls, dropdown menus, segment buttons, toggle switches, and sliders dynamically synchronize with the selected theme:
1. **Auto (Album Art)**: Modal background blooms with the active album cover's ambient color palette. All active buttons and controls glow in the song's extracted primary accent color.
2. **Dark**: Deep, solid Apple Music dark appearance (`#121214`) with translucent glass buttons, crisp white active highlights, and Spotify green toggles.
3. **Light**: Clean Apple Music light appearance (`rgba(248, 248, 250, 0.98)` / `#f5f5f7`), crisp dark typography (`#111113`), white active pills with drop shadow, and iOS emerald toggles.

---

## 2. Dynamic Theme Architecture & CSS Variable Engine

### A. Root Modal Window Variables (`components/AppleMusicSettingsModal.tsx`)
The modal root computes and injects a unified set of CSS custom properties directly onto the `.modalWindow` container:

```tsx
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
    };
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
    };
  }

  // AUTO (Album Art / Palette Theme)
  const primary = previewPalette?.primary || "#1db954";
  const primaryRgb = parseRgbString(primary);
  const glow = previewPalette?.glow || "rgba(29, 185, 84, 0.4)";
  const contrast = isPaletteLight ? "#111113" : "#ffffff";
  const overlayGradient = previewPalette?.overlayGradient ||
    `radial-gradient(circle at 35% 50%, rgba(${primaryRgb}, 0.28) 0%, rgba(12, 12, 16, 0.92) 100%)`;

  const windowBg = isPaletteLight
    ? `radial-gradient(circle at 85% 15%, ${glow} 0%, rgba(248, 248, 250, 0.95) 65%), #f8f8fa`
    : `radial-gradient(circle at 85% 15%, ${glow} 0%, rgba(18, 18, 24, 0.88) 60%), ${overlayGradient}, #121216`;

  return {
    "--modal-theme": "auto",
    "--palette-primary": primary,
    "--palette-primary-rgb": primaryRgb,
    "--palette-contrast": contrast,
    "--palette-glow": glow,
    "--modal-window-bg": windowBg,
    "--modal-header-bg": isPaletteLight ? "rgba(248, 248, 250, 0.92)" : "rgba(18, 18, 22, 0.88)",
    "--modal-border": `rgba(${primaryRgb}, 0.24)`,
    "--modal-text": isPaletteLight ? "#111113" : "#ffffff",
    "--modal-text-dim": isPaletteLight ? "rgba(20, 20, 24, 0.65)" : "rgba(255, 255, 255, 0.68)",
    "--btn-neutral-bg": `rgba(${primaryRgb}, 0.09)`,
    "--btn-neutral-hover": `rgba(${primaryRgb}, 0.16)`,
    "--btn-neutral-border": `rgba(${primaryRgb}, 0.2)`,
    "--btn-neutral-color": isPaletteLight ? "rgba(20, 20, 24, 0.75)" : "rgba(255, 255, 255, 0.75)",
    "--btn-active-bg": primary,
    "--btn-active-color": contrast,
    "--btn-active-shadow": `0 2px 14px ${glow}`,
  };
}, [isLightTheme, isDarkTheme, previewPalette, isPaletteLight]);
```

---

## 3. Control & Button Behavior Matrix

| UI Component | Dark Theme | Light Theme | Auto (Album Art) Theme |
| :--- | :--- | :--- | :--- |
| **Modal Background** | `#121214` solid dark | `rgba(248, 248, 250, 0.98)` | Album ambient radial glow + overlay gradient |
| **Category Tabs (Active)** | `rgba(255, 255, 255, 0.2)` + white type | `#ffffff` pill + `#111113` type | Album primary accent (`var(--palette-primary)`) + radiant glow |
| **Category Tabs (Inactive)** | Translucent white (`rgba(255, 255, 255, 0.65)`) | Translucent dark (`rgba(20, 20, 24, 0.65)`) | Tinted neutral (`rgba(var(--primary-rgb), 0.08)`) |
| **View Mode Switcher** | Translucent dark pill | Light gray pill | Tinted translucent pill |
| **View Mode Active** | `rgba(255, 255, 255, 0.22)` | Solid white pill | Album primary accent + glow |
| **Dropdown Triggers** | Dark translucent border | Slate border | Album primary hover & focus outline |
| **Dropdown Popover Selection** | Translucent white item + white bar | Light blue item + `#0071e3` bar | Album accent tinted item + accent bar |
| **Segmented Selectors** | High-contrast dark active | Clean white active pill | Album primary accent pill |
| **Toggle Switches** | Spotify green (`#1ed760`) | iOS green (`#34c759`) | Album primary accent + glow |
| **Range Slider Thumbs** | Solid white | Deep slate (`#111113`) | Album primary accent + glow |
| **Section Header Badges & Line** | Subtle white glow | Slate line | Album primary gradient line & icon tint |
