# Nocturne — Living Documentation & Technical Architecture

Welcome to the central documentation hub for **Nocturne** (formerly Lirics), an advanced real-time synced lyrics platform engineered with an Apple Music & Riff aesthetic, high-DPI HTML5 canvas visualizers, and a zero-latency local Windows OS media bridge.

---

## 📑 Table of Contents
1. [System Architecture & Playback Pipeline](#1-system-architecture--playback-pipeline)
2. [Tauri 2.0 Native Desktop Architecture](#2-tauri-20-native-desktop-architecture)
3. [Visual Features & Animation Suite](#3-visual-features--animation-suite)
4. [Split Studio & Live Preview Engine](#4-split-studio--live-preview-engine)
5. [Dynamic Contrast Star Rating System](#5-dynamic-contrast-star-rating-system)
6. [Gruvbox Vector Icon Suite & Zero-Emoji Architecture](#6-gruvbox-vector-icon-suite--zero-emoji-architecture)
7. [Technical Reports & Changelog Index](#7-technical-reports--changelog-index)
8. [Living Documentation Maintenance Protocol](#8-living-documentation-maintenance-protocol)

---

## 1. System Architecture & Playback Pipeline

Lirics employs a hybrid **Dual-Engine Playback Architecture** designed to deliver instant track updates, zero-latency playback control, and 100% resilience against Spotify cloud rate limits.

```mermaid
flowchart TD
    subgraph Client ["Client (Browser / Kiosk)"]
        UI["Main Player & Synced Lyrics"]
        QueueCache["Queue & Lyrics Cache"]
        Burst["Rapid Burst Polling (100ms-600ms)"]
    end

    subgraph Backend ["Next.js Backend (127.0.0.1:3000)"]
        PosAPI["/api/spotify/pos"]
        PlaybackAPI["/api/spotify/playback"]
        LyricsAPI["/api/lyrics"]
        SMTCBridge["lib/localMediaBridge.ts"]
    end

    subgraph OS ["Windows OS (Local Machine)"]
        SMTC["Windows System Media Transport Controls (WinRT)"]
        MediaKeys["Virtual Media Key Injection (VK_MEDIA_NEXT)"]
        SpotifyApp["Spotify Desktop Application"]
    end

    subgraph Cloud ["External Cloud APIs"]
        SpotifyCloud["Spotify Web API (api.spotify.com)"]
        LRCLib["LRCLib Synchronized Lyrics API"]
        iTunes["Apple Music / iTunes Artwork API"]
    end

    UI -->|Poll Position & Queue| PosAPI
    UI -->|Next / Prev / Seek| PlaybackAPI
    UI -->|Fetch Lyrics| LyricsAPI

    PosAPI -->|1. Try Cloud Playback| SpotifyCloud
    PosAPI -.->|2. Fallback on 429/Empty| SMTCBridge
    PlaybackAPI -->|1. Try Cloud Command| SpotifyCloud
    PlaybackAPI -.->|2. Fallback on Error| MediaKeys

    SMTCBridge -->|Query Local Media (0.1s)| SMTC
    MediaKeys -->|Simulate Media Key (0.1ms)| SpotifyApp
    SMTC -->|Track Title & Artist| iTunes
    LyricsAPI -->|Search Lyrics (1.8s Timeout)| LRCLib
    LyricsAPI -->|Backup Color Lyrics| SpotifyCloud
```

### Key Technical Mechanisms
- **Zero-Quota Local Fallback ([`lib/localMediaBridge.ts`](../lib/localMediaBridge.ts))**: If Spotify's Web API returns `429 Too many requests QUOTA_EXCEEDED` or when offline, the backend queries Windows SMTC via WinRT. The active song, artist, album, duration, and position are extracted in **100ms - 250ms** with zero cloud calls.
- **Sub-100ms Hardware Media Controls ([`pages/api/spotify/playback.ts`](../pages/api/spotify/playback.ts))**: When skipping, the server simulates Windows virtual media keys (`VK_MEDIA_NEXT_TRACK` / `VK_MEDIA_PREV_TRACK`). Spotify Desktop executes the skip in **0.1ms**.
- **Rapid Polling Burst**: On skip, queries fire at `100ms`, `300ms`, `600ms`, and `1200ms`, eliminating the 1-5 second polling lag.
- **LRCLib Timeout Guard ([`pages/api/lyrics.tsx`](../pages/api/lyrics.tsx))**: Bounded by `AbortSignal.timeout(1800)` to ensure lyric requests never hang for 15 seconds if external servers experience connection lag.
- **Proactive Queue Pre-Fetching ([`providers/LyricsContext.tsx`](../providers/LyricsContext.tsx))**: Up to 3 upcoming tracks in the queue have their lyrics downloaded and cached in memory before the user even clicks "Next" (**0ms cache-hit skip**).

---

## 2. Tauri 2.0 Native Desktop Architecture

Lirics is packaged as a high-performance **Tauri 2.0 native Windows desktop application** built with Rust (`rustc 1.99.1`) and Microsoft Visual C++ Build Tools (`cl.exe`, `link.exe`, Windows 11 SDK `10.0.26100`):

- **Pure Lyrics Focus**: Built strictly around the live synced lyrics screen with zero unwanted tabs, playlists, or navigation clutter.
- **Micro-Footprint Release Executable**: The compiled release binary ([`src-tauri/target/release/app.exe`](../src-tauri/Cargo.toml)) is only **8.8 MB** with instant sub-100ms startup.
- **Hardware-Accelerated WebView2**: Native Edge WebView2 rendering engine powering high-DPI 60fps canvas visualizers (Fluid Aurora Mesh, Ambient Stardust, Riff Wave progress bar, Vinyl Turntable).
- **Execution Commands**:
  - `npm run desktop`: Launches development environment with live hot-reload (`tauri dev`).
  - `npm run desktop:run`: Launches the optimized release binary via [`run-desktop.ps1`](../scripts/archive/run-desktop.ps1).
  - `npm run desktop:build`: Compiles and bundles production desktop binaries.

---

## 3. Visual Features & Animation Suite

| Feature | Component | Technical Implementation |
| :--- | :--- | :--- |
| **Vinyl Turntable Mode** | [`VinylTurntable.tsx`](../components/VinylTurntable.tsx) | Features a 33 RPM grooved vinyl record with dual anisotropic light flare reflections (`conic-gradient`), brass spindle, center artwork label, and an animated metallic tonearm that pivots 23° onto the groove when playing. Supports both **Turntable Deck** and **Sleeve Slide-Out** styles with 100% GPU compositor acceleration (`transform`, `will-change`). |
| **Instrumental Break Indicator** | [`InstrumentalBreak.tsx`](../components/InstrumentalBreak.tsx) | Displays 3 glowing sequential pulsing dots (`•••`) with a contextual countdown pill (`"Guitar Solo • Xs"` or `"Instrumental • Xs"`). Memoized with idle CPU protection (animations pause when inactive) and clickable instant-seek skip to vocals. |
| **Fluid Aurora 3D Mesh** | [`FluidAuroraMesh.tsx`](../components/FluidAuroraMesh.tsx) | HTML5 Canvas-powered fluid wave harmonics. Renders 3 multi-layered sinusoidal waves undulating at varying frequencies with album palette gradient blending (`screen`/`multiply`). Clamped internal resolution ($800 \times 450\text{px}$) with hardware bilinear scaling eliminates all GPU fill-rate pressure, replacing legacy 90px CSS blurs. |
| **Ambient Stardust** | [`AmbientStardust.tsx`](../components/AmbientStardust.tsx) | Single-batch canvas particle field rendering 36–48 microscopic stardust specks with vertical drift, sinusoidal horizontal sway, and breathing twinkle. Automatically pauses when playback stops or the tab is hidden. |
| **Riff Wavy Scrubber** | [`RiffWavyProgressBar.tsx`](../components/RiffWavyProgressBar.tsx) | Canvas-rendered sinusoidal harmonic wave progress bar with authentic 42px wavelength and a dynamic capsule drag knob. |

---

## 4. Split Studio & Live Preview Engine

Located in [`components/AppleMusicSettingsModal.tsx`](../components/AppleMusicSettingsModal.tsx), the **Split Studio** provides an interactive half-by-half environment for real-time visual testing:
- **Synchronized Live Preview**: Renders lyrics, fluid aurora waves, spectrum visualizers, ambient stardust, and track artwork in real time.
- **Customizable Categorized Tabs**:
  - 🎨 **Appearance**: Theme (Auto/Dark/Light), Background styles, Palette Extraction algorithms (K-Means, OctTree, MedianCut), Fonts.
  - 📝 **Lyrics**: Blur intensity (1–5), Auto-unblur on hover, Bold typography, Karaoke bouncing ball, Vocalist badges.
  - ✨ **Visuals**: Spectrum Visualizer, Visualizer styles (Bars/Waveform/Pulse), Instrumental Breaks, Vinyl Turntable Mode & Styles, Fluid Aurora 3D Mesh, Ambient Stardust, Album Edge Glow.
  - ⚡ **Playback**: Wavy progress bar, Animation easing curves, Dynamic speed multipliers, Pulling elastic effects.
- **Snappy Dropdown UX**: Zero-jitter dropdown menus with instant `0.06s` hover highlights and active glowing trigger borders.
- **Pinned Segmented Category Bar**: High-comfort 44px pill navigation bar anchored in a dedicated subheader (`categoryNavHeader`) outside the scrollable body. Features mathematically balanced equal-width tabs (`flex: 1`) and `scrollbar-gutter: stable`, eliminating vertical squashing and ensuring 0.00px position shift when switching categories or scrolling.

---

## 5. Dynamic Contrast Star Rating System

The Liked Song star button in [`pages/index.tsx`](../pages/index.tsx) automatically adapts its fill, stroke, and glow based on underlying background luminosity:
- **Light Backgrounds ($\ge 4.5:1$ WCAG AA Certified)**: Filled with deep amber gold (`#b45309`), dark stroke (`#78350f`), and grounding drop-shadow (`drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))`), housed in a warm frosted pill (`rgba(180, 83, 9, 0.12)`). Never washes out against white album covers.
- **Dark Backgrounds ($> 10:1$ Contrast Ratio)**: Filled with luminous star gold (`#fbbf24`), warm amber outline (`#f59e0b`), and radiant bloom (`drop-shadow(0 0 8px rgba(245, 158, 11, 0.65))`).
- **Interactive Pop**: Spring-loaded micro-interaction (`starPop 0.32s`) upon toggling.

---

## 6. Gruvbox Vector Icon Suite & Zero-Emoji Architecture

To provide a refined aesthetic, all emojis across the application have been eliminated and replaced with bespoke vector icons from the Gruvbox symbolic suite (`C:\Users\Ziad\Downloads\gruvbox-icons`):

- **Permanent In-App Backups**: 24 vector SVG icons backed up locally at [`public/icons/gruvbox/`](../public/icons/gruvbox/) and [`assets/gruvbox-icons/`](../assets/gruvbox-icons/).
- **Dynamic Theme Color Reactivity**: Built with `<GruvboxIcon name="..." />` ([`components/icons/GruvboxIcon.tsx`](../components/icons/GruvboxIcon.tsx)) utilizing `fill="currentColor"`. Automatically inherits text, palette accent, dark mode, or light mode colors with high contrast.
- **Embedded Zero-Latency Paths**: SVG paths are pre-compiled into the application bundle, guaranteeing instant first-frame rendering with zero network fetches, zero asset flickers, and full offline support in the native Tauri 2.0 desktop app.

---

## 7. Technical Reports & Changelog Index

All detailed investigation reports, performance benchmarks, and architectural analyses are preserved in the [`docs/reports/`](./reports/) directory:

| Report Document | Description & Key Findings |
| :--- | :--- |
| [**MPRIS Delimiter Normalization, Toast Cleanup & Top-Right Audio Quality Hover Badge**](./reports/mpris_delimiter_toast_cleanup_and_hover_badge.md) | Suffix stripping (` | YouTube Music`), silent NoMatch fallback, and subtle top-right hover status pill. |
| [**Real Linux GPU Detection, Framerate Optimization & Sub-3s Lyrics Latency Fix**](./reports/gpu_detection_fps_and_lyrics_latency_fix.md) | 3000ms AbortController timeout race, Unknown Artist Kuwo resolution, native lspci NVIDIA RTX 3050 detection, and layout thrashing elimination. |
| [**Markdown Link Validation & Documentation Integrity Audit**](./reports/markdown_link_validation.md) | Comprehensive audit, path normalization, asset ingestion, and 100% link resolution verification across all 35 documentation files. |
| [**Single-Instance Guard & Redesigned Sign-In**](./reports/single_instance_and_redesigned_signin.md) | Universal single-instance concurrency lock preventing duplicate tabs/instances, redesigned dark glassmorphic in-app sign-in page with ambient orbs, and animated $0\% \to 100\%$ OAuth loading progress bar. |
| [**Spotify OAuth 429 & Auth Error Resolution**](./reports/spotify_oauth_429_error_fix.md) | Resolution of "Try signing in with a different account" error. Rate limit coordinator, SMTC-first zero-cloud polling, resilient NextAuth `userinfo` fallback, and developer whitelist instructions. |
| [**Karaoke Multi-Line Sequential Sweep Fix**](./reports/karaoke_multiline_sweep_fix.md) | Elimination of simultaneous multi-line highlighting bug across wrapped lyrics. Sequential word tokenization via `lib/lyricTokenizer.ts`, 2D multi-line bouncing dot syllable follower, and 120 FPS sub-0.01ms RAF performance. |
| [**Playback Skip Speed & SMTC Refresh Fix Report**](./reports/playback_speed_and_smtc_fix.md) | Elimination of the HTTP 405 skip bug, fixing the 5s UI/audio desync, unconditional SMTC polling on refresh, and native Tauri vs Web performance analysis. |
| [**Gruvbox Vector Icon Suite & Zero-Emoji Report**](./reports/gruvbox_icons_migration.md) | Full audit removing all 22 emojis, establishing local icon backups in `public/icons/gruvbox/` and `assets/gruvbox-icons/`, and implementing dynamic theme reactivity with `<GruvboxIcon />`. |
| [**Tauri 2.0 Desktop Migration Report**](./reports/tauri_2_desktop_migration.md) | Complete documentation of the native Tauri 2.0 Windows desktop build, WebView2 runtime integration, MSVC C++ toolchain setup, and standalone 8.8MB release binary. |
| [**Playback Latency & Native App Analysis**](./reports/playback_latency_and_native_app_analysis.md) | In-depth analysis of the 5s skip lag, root cause of Spotify API `429 QUOTA_EXCEEDED` rate limits, local Windows SMTC bridge implementation, and Rust/Tauri native app architectural comparison. |
| [**Optimized Visual Suite Report**](./reports/optimized_visual_suite_report.md) | Technical details and performance benchmarks for Vinyl Turntable Mode, Instrumental Break Dots, Fluid Aurora 3D Canvas Mesh, and Ambient Stardust. |
| [**Dropdown Hover & Performance Report**](./reports/dropdown_hover_fix_report.md) | Resolution of dropdown menu lag: removing `transform: translateX(2px)` jitter, 0.06s hover transition, and active chevron rotation. |
| [**Riff Wavy Bar Report**](./reports/riff_wavy_bar_report.md) | Implementation of the high-DPI HTML5 canvas sinusoidal wavy progress bar replacing distorted SVG paths. |
| [**Blur Settings Fix Report**](./reports/blur_settings_fix.md) | Correction of blur slider ranges and styling in docked/side modal layouts. |
| [**Visual Features Report**](./reports/visual_features_report.md) | Initial architecture and design specification for the Riff visual features suite. |
| [**Riff Visual Suite Report**](./reports/riff_visual_suite_report.md) | Full suite integration covering typography scaling, word sparkle shimmer, and karaoke bouncing indicators. |

---

## 8. Living Documentation Maintenance Protocol

To ensure this documentation remains accurate and up-to-date across future enhancements:
1. **New Visual Features**: Document new options in `typings/LyricsSettings.ts` and add corresponding sections to Section 2 of this README.
2. **Performance Improvements**: Measure latency benchmarks before and after, saving the detailed audit into `docs/reports/` and updating the latency table in Section 1.
3. **Screenshots & Assets**: Store verification images in `docs/assets/` using descriptive names (e.g. `feature_mode_verified.png`).
4. **Changelog Updates**: Add new entries to the Reports Index in Section 7 with direct relative links.
