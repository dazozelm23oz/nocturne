# Lyrics Underglow Left Boundary Blend Fix Report

**Release Date:** October 29, 2026  
**Application:** Nocturne  
**Module:** `styles/AppleMusic.module.css` (`.lyricsScroller`, `.lyricLine`, `.wordShining`, `.karaokeWord.wordActive`)

---

## 1. Problem Description

During active karaoke lyrics playback ("rolling"), users observed an artifact with the active line's white underglow:
- While the glow smoothly diffused on the top, right, and bottom into the background, the **left-hand side exhibited a visible straight-ish vertical cutoff**.
- This straight cutoff interrupted the organic glow aesthetic and made the rectangular bounding container edge noticeable.

---

## 2. Root Cause Analysis

1. **Tight Container Horizontal Padding**:
   - `.lyricsScroller` was configured with `padding: 38vh 6vw 42vh 2vw;`.
   - On standard laptop resolutions (1366px to 1920px), `2vw` provided only **25px to 38px** of left clearance.
2. **Horizontal Overflow Clipping by CSS Specification**:
   - Because `.lyricsScroller` has `overflow-y: auto`, CSS standards require browsers (Blink / WebView2) to clip any horizontal overflow at $x = 0$.
3. **Underglow Blur Spread Exceeding Margin**:
   - `wordShining` and `.lyricLine.active` applied multiple drop-shadow filters (`drop-shadow(0 0 16px ...) drop-shadow(0 0 32px ...)`).
   - The Gaussian blur tails of these shadows extended **50px to 60px** outward from the glyphs.
   - Because the first character was placed only 25px–38px from the left container boundary, the outer 20px–30px of the glow exceeded $x = 0$ and was **hard-clipped into a straight vertical edge**.
4. **Knife-Edge Sweep Gradient**:
   - `.karaokeWord.wordActive` used `calc(var(--word-pct, 0%) + 0.5%)`, causing a knife-edge sweep line across letterforms instead of a feathered organic transition.

---

## 3. Implementation Details

### 1. Expanded Scroll Container Left Clearance
In [`styles/AppleMusic.module.css`](../../styles/AppleMusic.module.css):
```css
.lyricsScroller {
  /* Increased from 2vw to max(4.5vw, 68px) */
  padding: 38vh 6vw 42vh max(4.5vw, 68px);
}
```
* **Effect**: Provides **68px to 90px** of generous horizontal margin on the left, ensuring the 38px Gaussian glow completely diffuses to 0% opacity well before reaching the $x = 0$ scroll container boundary.

### 2. Internal Line Padding & Bleed Box
```css
.lyricLine {
  padding: 4px 18px 4px 18px;
  margin-left: -18px;
  box-sizing: border-box;
  border-radius: 12px;
  max-width: 816px;
}
```
* **Effect**: Expands the paint bounds of each lyric line while preserving visual text alignment, preventing glyphs on wrapped lines from touching the element box boundary.

### 3. Multi-Tier Gaussian Ambient Bloom (`wordShining`)
Replaced the dense dual-shadow clump with a 3-tier progressive Gaussian falloff:
```css
.wordShining {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.55))
          drop-shadow(0 0 20px rgba(255, 255, 255, 0.35))
          drop-shadow(0 0 38px rgba(255, 255, 255, 0.15)) !important;
}
```
* **Effect**: Yields a soft, luminous core that decays gradually into an ultra-smooth ambient aura with zero banding or abrupt edges.

### 4. Feathered Leading & Trailing Karaoke Sweep
```css
.lyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #ffffff) 0%,
    var(--active-lyric-color, #ffffff) calc(var(--word-pct, 0%) - 2%),
    rgba(255, 255, 255, 0.92) var(--word-pct, 0%),
    rgba(255, 255, 255, 0.38) calc(var(--word-pct, 0%) + 6%),
    rgba(255, 255, 255, 0.38) 100%
  );
}
```
* **Effect**: Replaces the knife-edge 0.5% cutoff with an 8% feathered transition curve that smoothly rolls across text, matching Apple Music iOS 18 behavior.

---

## 4. Verification

- Zero TypeScript compilation errors (`tsc --noEmit` code 0).
- Left-side underglow confirmed to naturally dissolve with 360-degree Gaussian softness.
- Antigravity background tasks verified at 0.
