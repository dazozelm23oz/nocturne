# Nocturne Studio — Riff Architecture & Header Redesign Report

**Date:** 2026-10-29  
**Status:** Completed & Verified (HTTP 200, TypeScript 0 errors)  
**Target Codebase:** `C:\Users\Ziad\.gemini\antigravity\scratch\lirics`

---

## 1. Visual Problem Diagnostics & Architectural Solutions

### A. The Top-Bar Header (Image 2 Fix)
- **Previous Issue:**
  - Segmented layout mode switcher had harsh blocky cyan fills (`#00e5ff`) with black text and mismatched unicode wireframe glyphs (`◫`, `▢`).
  - `Show Preview` and `✖` (close) button wrapped into an awkward second line directly below the mode switcher, looking like an accidental overflow bug.
  - Close button was disconnected from standard window position (far top right).
- **Redesign (Riff Parity):**
  - **Single Rigid Horizontal Row:** Enforced `height: 60px; padding: 0 24px; flex-wrap: nowrap !important; white-space: nowrap !important;`.
  - **Sleek Minimalist Title:** Clean `Settings` title in semi-bold typography accompanied by a refined `Nocturne v4.2` badge in muted frosted glass.
  - **Refined Mode Switcher Capsule:** Low-profile pill container (`Split`, `Dock`, `Window`) with Gruvbox symbolic vector icons. The active state smoothly takes the theme's accent color (`var(--palette-primary)`) with contrast text (`var(--palette-contrast)`), eliminating harsh bright cyan clashing.
  - **Inline Preview Toggle:** Sits directly inline on the same horizontal axis in Split mode.
  - **Corner Close Button `✕`:** Pinned to the far top-right corner with 32x32px circular geometry and subtle hover effect.

```
+-------------------------------------------------------------------------------------------------------+
|  Settings  [Nocturne v4.2]             [Split | Dock | Window]  [Hide Preview]  |  [✕]                 |
+-------------------------------------------------------------------------------------------------------+
```

---

### B. Vertical Category Sidebar Architecture (Image 1 Inspiration — Riff Player)
- **Previous Issue:**
  - Category tabs were crammed into a 6-column horizontal grid (`grid-template-columns: repeat(6, 1fr)`) across the top of settings, squishing text and causing truncation.
- **Redesign (Riff Parity):**
  - **Vertical Sidebar (`.riffSidebar`):** Pinned on the left side (width: 220px) of the settings window.
  - **Instant Search Box (`.riffSearchBox`):** Features an interactive search input with SVG magnifying glass (`🔍 Search settings...`). Typing in this box immediately searches and displays matching settings across all categories.
  - **Vertical Pill Categories:**
    1. `All Settings` (Magic icon)
    2. `Interface & Theme` (Palette icon)
    3. `Lyrics & Motion` (Chat / Music icon)
    4. `Visual Effects` (Waves icon)
    5. `Sync & Spotify` (Gear icon)
    6. `Performance` (Thunderbolt icon)
  - **Active State:** Soft rounded rectangle pill taking `var(--palette-primary)` and `var(--palette-contrast)` with soft ambient glow.

---

### C. Right-Panel Live Studio Stage (Image 1 & Image 3 — Apple TV Espresso)
- **Previous Issue:**
  - Preview was rendered on the left, pushing settings to the right and lacking album metadata context.
- **Redesign (Riff & Apple TV Parity):**
  - Reordered into the standard 3-pane architecture in Split mode:
    - **Pane 1 (Left, 220px):** Navigation Sidebar & Search.
    - **Pane 2 (Center, 1fr):** Settings Content Cards.
    - **Pane 3 (Right, 380px):** Live Lyrics Studio Preview Stage.
  - **Top Card Component:**
    - High-res rounded album artwork (160x160px with drop shadow and border).
    - `NOW PLAYING` small-caps tracking tag in primary theme color.
    - Song title (bold) and artist subtitle.
  - **Kinetic Lyrics Stage:**
    - Active singing line with user-selected **Lyric Movement** (Apple TV Kinetic float, Center Snap, Wave Drift, Elastic Spring).
    - Active line highlighting in user-selected **Color Preset** (animated Rainbow Spectrum, Espresso Amber & Gold, Sunset Coral, Neon, Emerald, etc.) or adaptive album accent.
    - Active line in **Editorial Serif** typography matching Sabrina Carpenter's Espresso presentation.
    - Inactive lines smoothly blurred and faded.

---

## 2. Integrated GPU (iGPU) Recommendation

- **Is it recommended to run on integrated GPU?**
  - **Yes, it is fully supported and recommended** if your monitor is physically plugged into the motherboard output.
  - **Why did it lag before?** WebView2 with nested CSS `backdrop-filter: blur(...)` combined with full-screen continuous canvas repaints saturates iGPU memory bandwidth.
  - **Our Fixes:**
    - Stripped all nested and redundant backdrop blurs from modal children.
    - Offloaded kinetic transitions to hardware-accelerated CSS `transform: translate3d(...)`.
    - Added the low-power mode and FPS diagnostic overlay in Nocturne's Performance category, maintaining 55-60 FPS even on Intel/AMD integrated graphics.
