# MPRIS Delimiter Normalization, Toast Cleanup & Top-Right Audio Quality Hover Badge

## Executive Summary
This update addresses three user experience and metadata synchronization requirements on Linux (MPRIS):
1. **MPRIS Raw Delimiter & Title Noise Parsing**: Resolving token collisions when web players (such as YouTube Music in a browser) append `" | YouTube Music"` or `" - YouTube"` into the raw title string, and widening search matching when the artist is empty or platform-branded.
2. **Toast Notification Suppression**: Removing intrusive center-screen toasts on `NoMatch`, allowing smooth, silent fallback to local playback (YouTube Music).
3. **Subtle Top-Right Audio Quality Hover Badge**: Placing an audio status pill directly inside the top-right container alongside the quick Lyrics/Karaoke buttons. Invisible by default, it appears strictly on hover with a green dot (`"HQ Audio: FLAC"`) or red dot (`"Fallback: YouTube Music"`).

---

## 1. Problem Statements & Root Causes

### Issue 1: Delimiter Splitting & Platform Noise Polluting Kuwo Search
- **Observation**: Terminal logs revealed raw MPRIS outputs such as:
  ```text
  "U Werent Here I Really Miss You | YouTube Music | Playing | 10300062 | 16000000"
  ```
- **Root Cause**: The web player window title contained `" | YouTube Music"`, and the artist tag was omitted by the browser's MPRIS bridge. Splitting by pipe `|` caused `" YouTube Music "` to be misidentified as the artist, polluting downstream queries and resulting in 0 search hits on the Kuwo music backend.
- **Solution**:
  - Implemented `stripPlatformSuffixes` in [`lib/localMediaBridge.ts`](../../lib/localMediaBridge.ts), aggressively stripping `" | YouTube Music"`, `" - YouTube"`, and similar suffixes from the title before search queries are formed.
  - When `artist` is empty or matches platform branding (`"YouTube Music"`, `"YouTube"`, `"Topic"`), the resolver passes the clean title **without an artist** to the Kuwo search API (`hq_search`), maximizing hit rates.
  - In [`src-tauri/src/hq_music.rs`](../../src-tauri/src/hq_music.rs), `search_track` filters out `"youtube music"` and `"youtube"` from the artist parameter to query solely by track title.

### Issue 2: Intrusive Center Toast Notification
- **Observation**: Every time an external track lacked an HQ lossless match, a large modal toast appeared in the center of the display: `"No HQ match found for ... Continuing current playback."`
- **Solution**:
  - In [`lib/useHqPlayback.ts`](../../lib/useHqPlayback.ts), removed the `onToast(...)` trigger on `!track || !track.id`. When an HQ stream is unavailable, the player silently continues playing the local YouTube Music / MPRIS stream without interrupting the user.

### Issue 3: Subtle Hover Badge for Audio Quality Status
- **Requirement**: Display a clean status badge in the top right corner indicating whether HQ lossless audio is actively streaming or if the app is falling back to YouTube Music.
- **Solution**:
  - Integrated the status pill directly into `.quickSourceContainer` in [`pages/index.tsx`](../../pages/index.tsx) alongside the quick Lyrics and Karaoke switcher buttons.
  - Inherits the hover styling of `.quickSourceHotspot`: 100% invisible by default (`opacity: 0; pointer-events: none;`), transitioning into view when the top-right corner is hovered.
  - Dynamic state bindings:
    - **HQ Active**: Green glowing indicator dot (`#1ed760`) with label `"HQ Audio: FLAC"` or `"HQ Audio: 320k"`.
    - **Fallback**: Red glowing indicator dot (`#ef4444`) with label `"Fallback: YouTube Music"`.

---

## 2. Technical Modifications Summary

| Component | File Path | Key Changes |
| :--- | :--- | :--- |
| **MPRIS Bridge** | `lib/localMediaBridge.ts` | Added `stripPlatformSuffixes`; cleaned `metaParts` token parsing; sanitized `artist` when empty/platform-branded. |
| **HQ Playback Engine** | `lib/useHqPlayback.ts` | Stripped platform suffixes from `searchTitle`; passed empty `searchArtist` for wide matching; removed `onToast` call on `NoMatch`. |
| **Rust Backend** | `src-tauri/src/hq_music.rs` | Enhanced query generator to treat `"youtube music"`, `"youtube"`, and `"topic"` as empty artist overrides. |
| **Main UI View** | `pages/index.tsx` | Formatted `qualityBadgeLabel` to output `"HQ Audio: FLAC"` / `"Fallback: YouTube Music"`; embedded badge inside top-right hover container. |

---

## 3. Verification & Validation

1. **Rust Backend Compilation**:
   - `cargo check --manifest-path src-tauri/Cargo.toml` passed with code `0`.
2. **Next.js Production Build**:
   - `npm run build` compiled all routes cleanly with code `0`.
3. **Automated Backup**:
   - Commits and file mirrors verified via `./backup.sh`.
