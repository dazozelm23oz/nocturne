# Lyric Movement Styles, Rainbow Animation, and Song Color Architecture Report

## Overview
This report documents the implementation of the reference Apple TV / Sabrina Carpenter "Espresso" lyric movement style, multiple new physics-based line transition types, dynamic animated Rainbow spectrum highlighting, comprehensive color palettes, and standard vs. per-song color scoping and pinning.

---

## 1. Key Features Implemented

### A. Apple TV Kinetic Flow & Movement Suite
Derived from the user's reference image ([`media_1793283910184_5d898595.png`](../assets/media_1793283910184_5d898595.png)), 6 distinct transition physics modes have been introduced under `settings.lyricMovement`:
1. **Apple TV Kinetic (Default)**:
   - Matches the reference image aesthetic: rising spring kinetic entry (`@keyframes kineticRise 0.52s cubic-bezier(0.16, 1, 0.3, 1)`) with subtle continuous scale elevation (`scale(1.05)`) and gentle multi-axis floating breath (`@keyframes kineticFloatBreathe 4.5s ease-in-out infinite`).
   - Smooth kinetic scroll controller: smoothly tracks the active line at $42\%$ viewport height (`scroller.scrollTo({ top: activeEl.offsetTop - scroller.clientHeight * 0.42, behavior: "smooth" })`).
2. **Cinematic Center Snap**:
   - Filmic dead-center focal lock (`cubic-bezier(0.19, 1, 0.22, 1)`) with smooth progressive blur on adjacent inactive lines.
3. **Floating Wave Drift**:
   - Dreamy sinusoidal multi-axis continuous drift (`@keyframes waveDriftFloat 5.2s ease-in-out infinite`) with 2D horizontal and vertical sway.
4. **Elastic Spring Pop (iOS 26 Style)**:
   - Punchy rubber-band overshoot curve (`scale(0.92) \to scale(1.085) \to scale(1.05)` over 480ms).
5. **Smooth Fade & Glide (Teleprompter)**:
   - Silky continuous 620ms cubic crossfade glide (`cubic-bezier(0.25, 1, 0.5, 1)`) for teleprompter-like readability.
6. **Subtle Classic**:
   - Pure Apple Music typographic display without float or scale displacement.

### B. Animated Rainbow Spectrum Highlighting
- Added **Rainbow Spectrum (Animated)** option to `settings.lyricGradient`.
- When enabled, the active lyric line and completed karaoke syllables illuminate with a 90-degree multi-stop chromatic spectrum:
  $$\text{linear-gradient}(90^\circ, \#\text{ff2a5f}, \#\text{ff7e40}, \#\text{ffc83b}, \#10\text{b981}, \#06\text{b6d4}, \#6366\text{f1}, \#\text{ec4899}, \#\text{ff2a5f})$$
- Continuous shifting animation via `@keyframes rainbowFlowShift 4s linear infinite` with chromatic multi-tier ambient drop shadows (`drop-shadow(0 0 18px rgba(255, 42, 95, 0.45)) drop-shadow(0 0 32px rgba(6, 182, 212, 0.35))`).
- Active karaoke syllables sweep with a dynamic rainbow leading edge.

### C. Rich Color Selection & Per-Song Pinning Architecture
- **Expanded Color Presets**:
  - `Album Accent Gradient` (Adaptive Material 3 tonal engine from cover art)
  - `Rainbow Spectrum (Animated)` (Prismatic animated rainbow)
  - `White Pure Glow` (Classic crystalline Apple Music white luminescence)
  - `Espresso Amber & Gold` (Warm Sabrina Carpenter golden honey glow matching the reference image)
  - `Sunset Coral & Peach` (Radiant sunset coral and warm peach)
  - `Vibrant Neon` (Electric cyan and sky blue)
  - `Emerald Aurora` (Mint emerald and teal aurora rays)
  - `Royal Amethyst` (Deep luxury amethyst violet)
  - `Rose Quartz` (Soft luxury blush pink)
  - `Custom Color` (Integrated native hex color picker)
- **Scope Options (`settings.lyricColorScope`)**:
  - **Per-Song Adaptive**: Automatically extracts and boosts colors from each song's individual album art.
  - **Standard Across All Songs**: Universally locks the chosen color or Rainbow across all tracks.
  - **Per-Song Pinned**: Allows pinning any chosen color preset to the currently playing song (`[ Pin to Song ]` action button), stored in `pinnedSongColors[songKey]` for persistent instant recall on replay.

### D. Editorial Serif Typography (Espresso Style)
- Added `Editorial Serif` to `settings.fontPreset`:
  - `font-family: "New York", "Playfair Display", "Cormorant Garamond", "Georgia", serif;`
  - Perfectly matches the high-contrast serif typography displayed in the user's reference photograph.

---

## 2. Verification
- Type check: `npx tsc --noEmit` verified with exit code `0`.
- Native process verification: `nocturne.exe` running with stable low CPU utilization.
- Zero background tasks verified via `manage_task list`.
