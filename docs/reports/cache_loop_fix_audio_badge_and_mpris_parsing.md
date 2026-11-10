# Tauri Watcher Loop Fix, Lossless Stream Resolution & Dynamic Audio Badge Report

## 1. Executive Summary
This report details the architectural fixes and feature additions implemented across Nocturne's backend, media bridge, and frontend interface:
1. **Resolution of the Tauri Infinite Rebuild Loop**: Moving the SQLite cache file out of the watched `src-tauri` directory into the standard Linux XDG data directory, accompanied by `.taurignore` configuration.
2. **403 Forbidden Stream Resolution Fix**: Ensuring strict song ID sanitization (`MUSIC_` prefix stripping) and terminal logging across all quality downgrade tiers.
3. **Advanced MPRIS Metadata Fallback**: Resolving the "Unknown Artist" bug by extracting artist and title tokens from raw D-Bus window titles with multi-delimiter splitting (`-`, `–`, `—`, `|`) and platform noise sanitization.
4. **Dynamic Live Audio Quality Hover Badge**: Exposing real-time stream quality states (`FLAC`, `320k`, `128k`, `Hi-Res FLAC`, or `YouTube Music`) via a subtle hover badge fixed in the top-right corner.
5. **Release Build Pipeline & Automated Backup**: Adding `"build:release"` to `package.json` and integrating the automated NTFS-safe snapshot backup script (`npm run backup`).

---

## 2. Issue 1: Tauri File Watcher Infinite Rebuild Loop

### Root Cause
During development (`npm run tauri dev`), the Tauri CLI establishes an active inotify watcher over the `src-tauri/` directory. Nocturne previously initialized the search cache database with `HqManager::new(backend, "hq_cache.db")`. Because the working directory in dev mode was `src-tauri/`, writing or updating rows touched `src-tauri/hq_cache.db` (and its SQLite journal/WAL files). The Tauri watcher interpreted this as a source change, immediately restarting the build pipeline and creating an infinite compile-relaunch loop:

```
Info File src-tauri/hq_cache.db changed. Rebuilding application...
Compiling nocturne v0.1.0...
```

### Technical Solution
1. **XDG Data Directory Migration ([`src-tauri/src/lib.rs`](../../src-tauri/src/lib.rs))**:
   The cache database path is now resolved to the standard user data directory (`$XDG_DATA_HOME/nocturne/hq_cache.db` or `~/.local/share/nocturne/hq_cache.db`), isolating all runtime disk writes outside the watched code repository:

   ```rust
   let data_dir = std::env::var("XDG_DATA_HOME")
       .map(std::path::PathBuf::from)
       .unwrap_or_else(|_| {
           let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
           std::path::PathBuf::from(home).join(".local").join("share")
       })
       .join("nocturne");
   let _ = std::fs::create_dir_all(&data_dir);
   let db_path = data_dir.join("hq_cache.db");
   let db_path_str = db_path.to_string_lossy().to_string();
   Some(Arc::new(hq_music::HqManager::new(backend, &db_path_str).unwrap()))
   ```

2. **Watcher Exclusion Filters ([`src-tauri/.taurignore`](../../src-tauri/.taurignore), [`.taurignore`](../../.taurignore))**:
   Created `.taurignore` files explicitly ignoring SQLite temporary and persistent files:
   ```gitignore
   *.db
   *.db-journal
   *.db-wal
   *.db-shm
   hq_cache.db*
   **/*.db*
   ```

---

## 3. Issue 2: 403 Forbidden Stream Resolution & ID Sanitization

### Root Cause
Upstream Kuwo search responses include track IDs formatted with a `MUSIC_` prefix (e.g. `MUSIC_626896065`). When query URLs forwarded this prefixed identifier to the `lx-music-api-server` Docker backend (`GET /url?source=kw&songId=MUSIC_626896065`), the server rejected the request with `HTTP 403 Forbidden`.

### Technical Solution ([`src-tauri/src/hq_music.rs`](../../src-tauri/src/hq_music.rs))
In `SelfHostedBackend::resolve`:
- The identifier is aggressively stripped and trimmed: `let clean_id = track_id.trim().trim_start_matches("MUSIC_").trim();`
- `clean_id` is passed directly without redundant re-encoding or prefixes to both the modern endpoint and the legacy fallback route across every downgrade tier.
- Added explicit debugging output `println!("RESOLVING CLEAN ID: {}", clean_id);` directly prior to HTTP execution.

---

## 4. Issue 3: "Unknown Artist" & Multi-Delimiter MPRIS Parsing

### Root Cause
Linux web browsers (Zen Browser, Firefox, Chromium) streaming YouTube Music often populate only `xesam:title` with the window title (e.g., `Lady Gaga - Disease | YouTube Music` or `The Party & The After Party | YouTube Music`) while leaving `xesam:artist` completely empty on D-Bus. When split on `|`, the empty artist position resulted in the UI falling back to `"Unknown Artist"`.

### Technical Solution ([`lib/localMediaBridge.ts`](../../lib/localMediaBridge.ts))
1. Added detailed terminal diagnostic logging: `console.log("RAW MPRIS OUTPUT:", output);`
2. Stripped platform branding suffixes from the working title (`| YouTube Music`, `- YouTube`).
3. Added intelligent hyphen and pipe delimiter parsing when the artist field is empty or generic branding (`Topic`, `YouTube Music`):

```typescript
// If artist is empty, platform branding, or Unknown Artist, split title by hyphens or pipes
if (!rawArtist.trim() || /^(?:unknown(?:\s*artist)?|youtube(?:\s*music)?|spotify|topic)$/i.test(rawArtist.trim())) {
  if (/[-–—]/.test(workingTitle)) {
    const dashParts = workingTitle.split(/\s*[-–—]\s*/);
    if (dashParts.length >= 2) {
      rawArtist = dashParts[0].trim();
      workingTitle = dashParts.slice(1).join(" - ").trim();
    }
  } else if (workingTitle.includes("|")) {
    const pipeParts = workingTitle.split(/\s*\|\s*/);
    if (pipeParts.length >= 2) {
      rawArtist = pipeParts[0].trim();
      workingTitle = pipeParts.slice(1).join(" | ").trim();
    }
  }
}
```

This guarantees `"Lady Gaga - Disease | YouTube Music"` correctly parses as:
- **Artist**: `Lady Gaga`
- **Title**: `Disease`

---

## 5. Feature: Dynamic Live Audio Quality Hover Badge

### Architecture ([`lib/useHqPlayback.ts`](../../lib/useHqPlayback.ts), [`pages/index.tsx`](../../pages/index.tsx))
To provide immediate visual confirmation of the active audio stream tier without cluttering the minimalist lyrics view, a dynamic status pill was added:

1. **State Exposure**: `useHqPlayback` exports `resolvedQuality` and `isHqActive`.
2. **Quality Formatting**: Computes user-friendly labels:
   - `Hi-Res FLAC` (24-bit studio master)
   - `FLAC` (16-bit CD-quality lossless)
   - `320k` (high-bitrate MP3)
   - `128k` (standard MP3)
   - `YouTube Music` (browser MPRIS source)
3. **Hover-Only Visibility**:
   - Fixed at `top: 14px; right: 16px` with `opacity: 0` by default.
   - Fades in smoothly to `opacity: 1` with a slight scale transform on mouse hover.
   - Includes a glowing green status dot for HQ audio and a red dot for external browser streams.

---

## 6. Build Pipeline & Backup Scripts
- Added `"build:release": "tauri build"` to [`package.json`](../../package.json).
- Added `"backup": "bash ./backup.sh"` to [`package.json`](../../package.json), ensuring reliable automated snapshots to external NTFS storage.
