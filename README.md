# Nocturne 🎵
> Linux-first native Tauri 2.0 desktop synced lyrics & high-fidelity lossless music platform with live MPRIS synchronization, Web Audio spectrum visualizers, and Apple Music / Riff aesthetics.

[![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue?style=flat&logo=tauri)](https://tauri.app/)
[![Linux](https://img.shields.io/badge/Platform-Linux%20%28Wayland%20%2F%20X11%29-orange?style=flat&logo=linux)](https://kernel.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-red?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Documentation](https://img.shields.io/badge/Docs-Reports-brightgreen?style=flat)](./docs/README.md)

Nocturne brings full Apple Music-grade typography, syllable-synced karaoke, real-time reactive audio spectrum visualizers, 3D fluid aurora mesh waves, and spinning vinyl turntable animations to Linux desktop listeners with native MPRIS D-Bus integration and an integrated HQ Lossless Audio streaming engine.

---

## 🎧 Architecture Highlights

- **Linux-First Native MPRIS Integration**: Direct D-Bus media queries via compiled Rust backend and `playerctl`. Sub-4ms polling with zero shell flash or focus stealing.
- **Dynamic Media Player Selector**: Discover and target specific Linux media player instances (Spotify, Zen Browser, Firefox, Chrome, VLC, MPV) with seamless Auto-detect.
- **HQ Lossless Audio Provider Suite**: Built-in Kuwo Music search via local self-hosted `lx-music-api-server`, automated 4-tier quality fallback (`Hi-Res -> Lossless FLAC -> 320k -> 128k`), and an embedded CORS-bypass streaming proxy.
- **Bi-Directional Seeking & Drift Snap**: Automatically snaps time progression if external playback drifts by $> 1.5\text{s}$, with instant microsecond-precision scrubber seeks.
- **Multi-Source Lyrics & Karaoke Priority**: Intelligent provider cascade (LRCLIB, NetEase Cloud Music, Spotify, Kugou, Musixmatch, Genius) for synchronized line-by-line and syllable word-by-word sweeps.
- **High-Resolution Artwork Pipeline**: Multi-tier cover art resolution querying iTunes ($600\times600$) with automatic fallback to Deezer ($1000\times1000$ `cover_xl`).
- **Authentic Visualizer & Turntable**: Web Audio `AnalyserNode` frequency spectrum visualizers, grooved vinyl turntable with tone-arm physics, and harmonic wavy progress bar.
- **Dynamic Audio Quality Hover Badge**: Minimalist top-right live stream status indicator fading in on hover to display active bitrates (`FLAC`, `320k`, `128k`, `Hi-Res FLAC`, `YouTube Music`).
- **Resilient XDG State & Watcher Immunity**: Isolates SQLite database stores in `$XDG_DATA_HOME/nocturne/` with `.taurignore` rules to eliminate dev-watcher infinite rebuild cycles.

---

## 🚀 Setup & Getting Started

### 1. Prerequisites
- **Linux Environment** (Fedora, Arch, Ubuntu, Debian, etc. with Wayland or X11)
- **Node.js 18+** or **Bun**
- **Rust Toolchain** (`rustc` & `cargo` 1.80+)
- **System Dependencies**: `playerctl`, `webkit2gtk-4.1` (or `webkit2gtk-4.0`), `openssl`, `libayatana-appindicator`

```bash
# On Fedora / RHEL
sudo dnf install playerctl webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel

# On Ubuntu / Debian
sudo dnf install playerctl libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev
```

### 2. HQ Audio Backend (Docker)
Nocturne's Lossless Audio Suite connects to a local `lx-music-api-server` Docker container on port `8080`:

```bash
docker run -d \
  --name lx-music-api \
  --restart always \
  -p 8080:8080 \
  ghcr.io/lyswhut/lx-music-api-server:latest
```

Verify backend health:
```bash
curl http://127.0.0.1:8080/status
```

### 3. Installation & Run
```bash
# Clone and install dependencies
git clone https://github.com/user/nocturne.git
cd nocturne
npm install

# Run in Development Desktop Mode (with live reload)
npm run tauri dev

# Or build optimized native Linux binary
npm run tauri build
```

The compiled release binary is generated at `src-tauri/target/release/nocturne`.

---

## 📚 Documentation Index

All architectural investigations, performance analyses, and feature specifications are documented in [`docs/reports/`](./docs/reports/):

- 🎚️ [**MPRIS Delimiter Normalization, Toast Cleanup & Top-Right Audio Quality Hover Badge**](docs/reports/mpris_delimiter_toast_cleanup_and_hover_badge.md) — Suffix stripping (` | YouTube Music`), silent NoMatch fallback, and subtle top-right hover status pill.
- ⚡ [**Real Linux GPU Detection, Framerate Optimization & Sub-3s Lyrics Latency Fix**](docs/reports/gpu_detection_fps_and_lyrics_latency_fix.md) — 3000ms AbortController timeout race, Unknown Artist Kuwo resolution, native lspci NVIDIA RTX 3050 detection, and layout thrashing elimination.
- 🔗 [**Markdown Link Validation & Documentation Integrity Audit**](docs/reports/markdown_link_validation.md) — Comprehensive audit, path normalization, asset ingestion, and 100% link resolution verification across all 35 documentation files.
- 🛠️ [**Tauri Watcher Loop Fix, Lossless Stream Resolution & Dynamic Audio Badge**](docs/reports/cache_loop_fix_audio_badge_and_mpris_parsing.md) — XDG cache isolation, 403 stream parameter fix, MPRIS delimiter parsing, and hover quality pill.
- 🐧 [**Linux MPRIS Migration Report**](docs/reports/linux_mpris_migration.md) — Shift from Windows WinRT SMTC to Linux D-Bus `playerctl` IPC.
- 🎵 [**HQ Lossless Audio Provider Report**](docs/reports/hq_audio_provider.md) — Kuwo API resolution, ID normalization, quality downgrade loop, and local proxy.
- 🎛️ [**Media Player Selector & Sync Report**](docs/reports/media_player_selector_and_sync.md) — Dynamic `playerctl -l` instance targeting, pause state retention, and seek drift snap.
- 🦀 [**Tauri 2.0 Desktop Migration**](docs/reports/tauri_2_desktop_migration.md) — Native Tauri 2.0 desktop shell architecture and IPC design.
- 🎨 [**Settings Theme Matching Suite**](docs/reports/settings_theme_matching_report.md) — WCAG luminance contrast engine and dynamic album palette synchronization.
- 🗄️ [**Persistent Cache & Server Resilience**](docs/reports/persistent_cache_and_server_resilience.md) — In-memory and disk caching architecture for zero-delay playback.
- ⚡ [**Performance Diagnostics Suite**](docs/reports/performance_diagnostics_suite_report.md) — Benchmarking frame rates, memory footprints, and round-trip API latencies.
- 🔍 [**Category Tabs & Glass Translucency**](docs/reports/category_tabs_and_glass_translucency_report.md) — High-performance frosted glass shader calculations.
- 🎨 [**Gruvbox Icons Migration**](docs/reports/gruvbox_icons_migration.md) — Clean SVG vector icon design system.
- 🎤 [**Karaoke Multiline Sweep Fix**](docs/reports/karaoke_multiline_sweep_fix.md) — Smooth continuous syllable interpolation across line wraps.
- 🌈 [**Lyric Movement Styles & Color Scope**](docs/reports/lyric_movement_styles_rainbow_and_color_selection_report.md) — Kinetic center snap, kinetic drift, and per-song color pinning.
- ⏱️ [**Lyrics Progression Lag & Monotonicity**](docs/reports/lyrics_progression_lag_and_monotonicity_fix.md) — Monotonic clock smoothing and boundary stability.
- ✨ [**Lyrics Underglow Left Blend Fix**](docs/reports/lyrics_underglow_left_blend_fix_report.md) — Text glow gradients and edge contrast preservation.
- 🎮 [**Playback Controls & Liked Songs**](docs/reports/playback_controls_and_liked_songs_fix_report.md) — Optimistic UI state updates and library synchronization.
- 🚀 [**Playback Speed & SMTC Fix**](docs/reports/playback_speed_and_smtc_fix.md) — Dynamic track speed compensation.
- 🌊 [**Riff Redesign & Header Fix**](docs/reports/riff_redesign_and_header_fix_report.md) — Riff-inspired aesthetic overhaul.
- 🎨 [**Riff Settings M3 Theming & Transparency**](docs/reports/riff_settings_m3_theming_and_transparency_report.md) — Material You M3 color quantization and dynamic theming.
- 📊 [**Settings FPS & Pure Lyrics Preview**](docs/reports/settings_fps_pinned_nav_and_pure_lyrics_preview_report.md) — Real-time studio preview panel and FPS metrics.
- 🎛️ [**Settings Header Redesign & Reactivity**](docs/reports/settings_header_redesign_and_theme_reactivity_report.md) — Reactive view modes and header controls.
- ⚡ [**Settings Performance Optimization**](docs/reports/settings_redesign_and_performance_optimization_report.md) — React rendering lifecycle optimizations for modal panels.
- 🔒 [**Single Instance & Redesigned Signin**](docs/reports/single_instance_and_redesigned_signin.md) — Native single-instance locks and authentication screens.
- 🛡️ [**Spotify OAuth 429 Resilience**](docs/reports/spotify_oauth_429_error_fix.md) — Backoff coordination and quota exhaustion handling.
- 🎯 [**Spotify SMTC Filter Report**](docs/reports/spotify_only_smtc_filter_report.md) — Media transport session isolation.

---

## 📄 License
MIT License. See [LICENSE](./LICENSE) for details.
