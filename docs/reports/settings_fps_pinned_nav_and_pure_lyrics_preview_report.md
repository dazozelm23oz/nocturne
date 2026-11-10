# Settings 60 FPS Optimization, Pinned Navigation & Pure Lyrics Preview Report

**Project**: Nocturne  
**Date**: October 29, 2026  
**Status**: Completed & Verified  

---

## 1. Problem Overview & Scope

### 1.1 The 20 FPS Drop When Settings Opened
- While playing music on the main screen, the application ran at 55–60 FPS.
- When opening Settings with preview off, the framerate plummeted to ~20 FPS.
- **Root Causes**:
  1. `RiffWavyProgressBar` in `pages/index.tsx` was running a 60 FPS HTML5 canvas sine-wave animation loop underneath the modal window (`isPlaying={data?.is_playing || false}`).
  2. `usePerformanceMetrics` in `AppleMusicSettingsModal.tsx` was active by default (`activeCategory === "all"`), running a continuous `requestAnimationFrame` loop and querying system stats, triggering frequent component re-renders.
  3. Multiple nested `backdrop-filter: blur(...)` passes across `.modalOverlay`, `.modalWindow`, `.modalHeader`, and `.categoryNavHeader` forced the GPU into recursive Gaussian blur passes on every frame.

### 1.2 Unpinned Navigation on Sub-Jump Clicks
- In Split Studio, clicking a sub-jump anchor (e.g. *Typography*, *Visual Effects*) caused the main category grid and sub-jump dock to scroll off-screen.
- **Root Cause**: `scrollToAnchor` called `el.scrollIntoView()`, which scrolls all ancestor scroll containers in the DOM rather than constraining the scroll to `modalBodyRef.current`.

### 1.3 Cluttered Preview UI Above and Below the Banner
- The preview pane previously had an awkward top bar, an album banner pill, and a bottom control bar with a play button, reset button, scrubber length slider, percentage badge, and "Test Pull" button.
- User required: **"remove te play button under the abanner and the reset and the length bar showng. just the lyrics and thats it"**.

---

## 2. Solutions Implemented

### 2.1 60 FPS Framerate Recovery
1. **Background Canvas Freezing in `pages/index.tsx`**:
   - Paused `RiffWavyProgressBar` when the modal is open:
     ```tsx
     isPlaying={!showSettingsModal && (data?.is_playing || false)}
     ```
2. **Deactivated Performance Loop When Idle**:
   - In `components/AppleMusicSettingsModal.tsx`:
     ```tsx
     const isPerfActive = isOpen && activeCategory === "performance";
     ```
   - Diagnostics and FPS counting loops only activate when the user explicitly opens the *Performance & Diagnostics* tab.
3. **Elimination of Nested Blur Shaders**:
   - Removed redundant `backdrop-filter: blur(...)` passes from `.modalOverlay`, `.modalHeader`, and `.categoryNavHeader`.
   - Added `isolation: isolate; contain: paint; will-change: transform;` to `.modalWindow` in `styles/SettingsModal.module.css` to composite the modal on its own hardware plane.

---

### 2.2 Sticky Pinned Categories & Sub-Jump Anchors
1. **Relative Container Scrolling**:
   - Replaced `el.scrollIntoView()` with a relative offset calculation targeting only the inner scroll body:
     ```tsx
     const scrollToAnchor = useCallback((id: string) => {
       const container = modalBodyRef.current;
       const el = document.getElementById(id);
       if (container && el) {
         const containerRect = container.getBoundingClientRect();
         const elRect = el.getBoundingClientRect();
         const relativeTop = elRect.top - containerRect.top + container.scrollTop;
         container.scrollTo({ top: Math.max(0, relativeTop - 12), behavior: "smooth" });
       }
     }, []);
     ```
2. **Sticky Category Header**:
   - In `styles/SettingsModal.module.css`:
     ```css
     .categoryNavHeader {
       position: sticky;
       top: 0;
       z-index: 30;
     }
     ```
   - Both the main category buttons and the sub-jump anchors stay 100% pinned at the top regardless of how far the settings list is scrolled.

---

### 2.3 Pure, Distraction-Free Live Lyrics Preview
- Removed `studioBottomBar` entirely: no play button, no reset button, no scrubber slider, no length indicator, no "Test Pull".
- Removed the top preview bar and album banner pill.
- The preview pane now displays **exclusively the synchronized lyrics**:
  - Blurred previous line
  - Instrumental break dots (if active)
  - Active line with character-weighted karaoke word sweep, word shine, and particle sparkle
  - Blurred upcoming next line
  - Ambient fluid canvas background (Aurora Mesh / Stardust)

---

## 3. Verification & Safety

1. **TypeScript Compilation**: `npx tsc --noEmit` exited with code 0 (zero errors).
2. **Background Tasks**: 0 tasks running in `manage_task`.
