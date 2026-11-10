# Optimized Visual Features Suite Report

This report outlines the implementation and deep performance optimizations applied across the four requested visual features: **Vinyl Turntable Mode**, **Instrumental Break Indicator**, **Fluid Aurora 3D Mesh**, and **Ambient Stardust**.

---

## 1. Feature Implementations & Optimizations

### 1.1 Vinyl Turntable Mode
*Animated rotating record sleeve and spinning vinyl disc with tonearm.*

- **Dual Presentation Styles**:
  - **Turntable Deck**: Realistic hi-fi deck featuring a recessed platter well, green power LED indicator, brand plate, and full metallic tonearm assembly.
  - **Sleeve Slide-Out**: Realistic cardboard album jacket with spine gradient, surface gloss sheen, 33 RPM badge, and an animated vinyl disc that slides outward into playing position alongside an active tonearm needle.
- **Spinning Vinyl Disc**: Concentric micro-grooves rendered with repeating radial gradients, dual anisotropic light flare reflections (`conic-gradient`), brass center spindle hole, and circular album art center label.
- **Realistic Animated Tonearm**: Models a gimbal pivot base, metallic counterweight, chrome arm shaft, headshell cartridge, and needle tip. When playing, the tonearm rotates onto the active groove (`23deg`); when paused, it smoothly returns to its resting arm cradle (`0deg`).
- **Performance Optimizations**:
  - 100% GPU compositor-accelerated (`transform: rotate`, `will-change: transform`).
  - Zero JavaScript render loops — CSS animations switch to `animation-play-state: paused` when playback is stopped to conserve 100% GPU cycles.

---

### 1.2 Instrumental Break Indicator (•••)
*Three glowing pulsing dots counting down during long solos or guitar riffs before the next lyric line begins.*

- **Sequential Breathing Dots**: Three glowing dots (`•••`) with staggered pulse animations (0s, 0.25s, 0.5s) that rhythmically breathe with the song's primary accent bloom.
- **Contextual Countdown Badge**: Automatically distinguishes section length:
  - Sections $\ge 14\text{s}$: Displays `"Guitar Solo • Xs"`.
  - Sections $< 14\text{s}$: Displays `"Instrumental • Xs"`.
  - Includes a micro horizontal progress bar tracking completion.
- **Interactive Seek Jump**: Clicking the pill immediately seeks playback to 0.8s before the next vocal entry.
- **Performance Optimizations**:
  - Component wrapped in `React.memo` to eliminate unnecessary parent re-renders.
  - Animations are strictly disabled when inactive, avoiding idle CPU wakeups.

---

### 1.3 Fluid Aurora 3D Mesh
*Moving multi-layered fluid canvas wave behind the lyrics.*

- **Legacy Replacement**: Completely replaced the previous CSS implementation, which ran 4 massive `div` elements with `filter: blur(90px)`. High Gaussian blurs across large viewports cause severe GPU fill-rate pressure and thermal throttling on mobile/laptops.
- **HTML5 Canvas Fluid Wave ([`FluidAuroraMesh.tsx`](../../components/FluidAuroraMesh.tsx))**:
  - Renders 3 multi-layered harmonic sinusoidal waves undulating at differing frequencies, phases, and wavelengths.
  - Dynamically synthesizes vertical and radial gradients extracted from the track's dominant palette (`primary`, `secondary`, `glow`).
  - Uses composite screen/multiply blending for natural, liquid Aurora borealis depth.
- **Performance Optimizations**:
  - Internal canvas buffer is clamped (max $800 \times 450\text{px}$) with CSS hardware bilinear interpolation, drastically reducing GPU memory and fill-rate while looking perfectly smooth.
  - Render loop automatically pauses when playback is paused or the browser tab is hidden (`document.visibilityState === 'hidden'`).
  - Zero memory allocations per frame (all vertex loops use pre-allocated variables).
  - Removed 113 lines of obsolete heavy CSS rules and keyframes from [`AppleMusic.module.css`](../../styles/AppleMusic.module.css).

---

### 1.4 Ambient Stardust
*Floating micro-particles gently drifting across the background.*

- **Canvas Particle Field ([`AmbientStardust.tsx`](../../components/AmbientStardust.tsx))**:
  - Renders 36–48 microscopic stardust specks ($0.6\text{px} - 2.2\text{px}$) floating gently across the background.
  - Each particle features individual upward velocity, sinusoidal horizontal sway, and breathing twinkle phases.
  - Particles are tinted with soft radial halos matching the album's primary accent color.
- **Performance Optimizations**:
  - Single-batch canvas drawing pass: all particle paths are combined into a single draw call per frame.
  - Render loop pauses immediately when playback is paused or the window is minimized.
  - Fully integrated with a dedicated toggle under Settings → Visuals (`ambientStardust: boolean`, default: `true`).

---

## 2. File Architecture Summary

| File | Changes Made |
| :--- | :--- |
| [`typings/LyricsSettings.ts`](../../typings/LyricsSettings.ts) | Added `ambientStardust: boolean` to types and default configurations. |
| [`components/VinylTurntable.tsx`](../../components/VinylTurntable.tsx) | Upgraded turntable deck & sleeve slide-out with unified tonearm dynamics, micro-grooves, and hi-fi branding. |
| [`components/InstrumentalBreak.tsx`](../../components/InstrumentalBreak.tsx) | Memoized 3-dot pulse indicator with contextual solo detection, interactive skip, and idle CPU protection. |
| [`components/FluidAuroraMesh.tsx`](../../components/FluidAuroraMesh.tsx) | New high-efficiency multi-layered harmonic fluid canvas wave component. |
| [`components/AuroraMeshOrbs.tsx`](../../components/AuroraMeshOrbs.tsx) | Replaced legacy CSS blur orbs with clean wrapper around `FluidAuroraMesh`. |
| [`components/AmbientStardust.tsx`](../../components/AmbientStardust.tsx) | New single-batch canvas micro-particle stardust system. |
| [`styles/AppleMusic.module.css`](../../styles/AppleMusic.module.css) | Purged 113 lines of obsolete heavy `blur(90px)` keyframe styles; added inactive break states. |
| [`pages/index.tsx`](../../pages/index.tsx) | Integrated `AmbientStardust` into main backdrop; connected live track palette to canvas wave. |
| [`components/AppleMusicSettingsModal.tsx`](../../components/AppleMusicSettingsModal.tsx) | Added Ambient Stardust toggle to Visuals category; integrated canvas wave and stardust into Split Studio. |
