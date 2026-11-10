# Nocturne Project Rules & Engineering Guidelines

This codebase is **Nocturne** (formerly Lirics), an Apple Music & Riff inspired synchronized lyrics player running on Next.js 14 and Tauri 2.0. Follow these strict engineering guidelines:

## 1. Zero-Emoji & Icon Consistency
- **No Emojis**: Never use emoji glyphs anywhere in UI elements, buttons, tabs, toasts, or settings.
- **Gruvbox Vector Icons**: Always render icons via `components/icons/GruvboxIcon.tsx` (using currentColor / CSS variables for theme reactivity).
- **Asset Backups**: Preserve local SVG icon packs in `public/icons/gruvbox/` and `assets/gruvbox-icons/`.

## 2. Persistent Cache Before Remote APIs
- **Cache-First Pattern**: Always check `lib/persistentCache.ts` (`getPersistentCache`) before calling Spotify Web API, LRCLib, or Apple iTunes.
- **Namespaces & TTLs**:
  - `lyrics:` (14 days TTL)
  - `artwork:` (30 days TTL)
  - `track_meta:` (7 days TTL)
- **Automatic Fallback**: Support both local atomic disk storage (`.cache/lirics_persistent_cache.json`) and optional Redis (`REDIS_URL`).

## 3. Resilient Fetch & Log Hygiene
- Use `lib/resilientFetch.ts` with a safe 8000ms default timeout and silent error trapping.
- Do not log raw `DOMException` or `TimeoutError` stack traces to the dev server console.

## 4. Playback Time Monotonicity & SMTC Extrapolation
- **SMTC Extrapolation**: In `lib/get_smtc.ps1`, calculate elapsed time since `$timeline.LastUpdatedTime` during playback.
- **Monotonic Progression**: During continuous playback without user seek/skip, time must never jump backwards.
- **Lyric Hysteresis**: In `LyricsContext.tsx`, prevent active lyric line deactivation or backward bouncing near line boundaries.

## 5. Settings Modal Layout & Theme Matching
- Settings modal category tabs must maintain equal 5-column grid widths (`repeat(5, 1fr)`).
- Use responsive tab labels (`Playback & System` -> `Playback` in compact/split mode).
- Respect dynamic theme styling: Auto (Album Palette), Dark, and Light, with user-editable glass blur and opacity sliders.

## 6. Native App Testing Protocol (No Chrome)
- When testing or verifying UI changes, feature behavior, or visual regressions, test against the native desktop app (`src-tauri/target/debug/app.exe` or WebView2 runtime), NEVER launch external Chrome browser instances.

## 7. Living Documentation Protocol
- Document architectural changes and performance fixes in `docs/reports/<topic>.md`.
- Keep `docs/README.md` updated with links and descriptions in the Reports Index.
