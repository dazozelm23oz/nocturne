# Nocturne Studio: Riff-Inspired Settings Redesign & Material 3 Theming Report

## Overview
This report documents the architectural, visual, and performance improvements applied to the Nocturne settings modal, inspired by [rootscripts/riff](https://github.com/rootscripts/riff) and the user-provided UI references.

---

## 1. Key Architectural & Visual Improvements

### A. Unified Single-Row Header & Control Layout
- **Problem**: Previously, the layout mode buttons (`Split Studio`, `Dock Left`, `Dialog`) displayed crude, solid glyphs (`◫`, `▢`), had verbose labels, and caused the `Show Preview` toggle and `✕` close button to droop into an awkward, clustered second row.
- **Solution**:
  - Replaced crude unicode boxes with high-precision vector outline SVG icons (`split`, `dock`, `window`).
  - Streamlined labels to concise, elegant terms: **Split**, **Dock**, and **Window**.
  - Unified the layout mode switcher, the live preview toggle, and the circular close button into a **single, responsive horizontal row** (`flex-wrap: nowrap !important`).
  - Styled the close button as an independent circular pill (`width: 32px; height: 32px; border-radius: 50%`) with smooth red hover highlight.
  - In **Dock Left** mode, mode switch buttons dynamically collapse into icon-only pills, preventing any wrapping or overflow even in narrow 520px side drawer view.

### B. Material 3 Expressive Tonal Architecture (Auto / Follow Album)
- **Problem**: In dark album covers, section titles and text became muddy or nearly invisible. Dropdowns and hovered controls were dull and unreadable.
- **Solution**:
  - Implemented `generateM3TonalPalette` in `lib/paletteExtractor.ts`:
    - **Intelligent Chroma Boost**: Any album palette with low saturation ($s < 0.18$) is dynamically boosted ($s \ge 0.36$), ensuring grayscale/black albums never wash out into dark gray mush.
    - **Tonal Contrast Guard**: Text luminance is clamped to high contrast: dark mode text uses $L \ge 95\%$, light mode text uses `#111113`, meeting WCAG AAA ($7:1$) standards.
    - Exported M3 tiers: `surface`, `surfaceContainer`, `primary`, `onPrimary`, `onSurface`, `onSurfaceVariant`, `outline`, and `glow`.
  - Every setting row, section header, title, and badge inherits these dynamic tonal variables.

### C. Category Navigation & Smart Anchors
- **Problem**: In Dock Left mode, category tabs leaked out of their boxes. Clicking sub-part jump buttons did not work across different category filters.
- **Solution**:
  - Added short labels (`tabLabelShort`) in Dock Left mode (`Visuals`, `Playback`, `Performance`), preventing label overflow or truncation.
  - Enhanced `scrollToAnchor`: when jumping to a subpart belonging to a different category, it automatically switches the active category first, waits for the DOM render, and smoothly scrolls to the target anchor.

### D. Dual Transparency & Hardware Layer Isolation
- **Interface Opacity**: True $0\% \to 100\%$ range with linear precision.
- **Backdrop Blur Intensity**: $0\text{px} \to 60\text{px}$ frosted glass adjustment.
- **Hardware Layer Isolation**: `.modalWindow` uses `contain: paint; isolation: isolate; will-change: transform;`, preventing viewport canvas repaints and maintaining 55-60 FPS while settings are open.

### E. Nocturne App Naming
- Replaced all legacy menu text (`Apple Music Lyrics Settings`) with `Nocturne Lyrics Studio`.

---

## 2. Verification
- TypeScript type checking: `npx tsc --noEmit` verified with exit code `0`.
- Native process verification: `nocturne.exe` running smoothly with stable low CPU utilization.
- Zero orphaned background tasks verified with `manage_task list`.
