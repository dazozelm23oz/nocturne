# Nocturne Lyrics — Complete Features & Architecture Guide

Welcome to the definitive feature and configuration manual for **Nocturne**. Nocturne is a native Linux Tauri 2.0 desktop synced lyrics and lossless music application, featuring live MPRIS D-Bus integration, real-time Web Audio spectrum visualization, and Apple Music / Riff aesthetics.

---

## Table of Contents
1. [Core Platform Architecture](#1-core-platform-architecture)
2. [Category 1: Interface & Theme](#2-category-1-interface--theme)
3. [Category 2: Lyrics & Kinetic Motion](#3-category-2-lyrics--kinetic-motion)
4. [Category 3: Lyric Sources & Priority Order](#4-category-3-lyric-sources--priority-order)
5. [Category 4: Visual Effects & Audio Visualizer](#5-category-4-visual-effects--audio-visualizer)
6. [Category 5: Playback, MPRIS & Lossless Audio Engine](#6-category-5-playback-mpris--lossless-audio-engine)
7. [Category 6: Performance & Diagnostics](#7-category-6-performance--diagnostics)
8. [Hidden & Pro Features](#8-hidden--pro-features)

---

## 1. Core Platform Architecture

### Linux-First Tauri 2.0 Native Shell
- **D-Bus & MPRIS Bridge**: Replaces legacy platform transport polling with direct Linux D-Bus `playerctl` metadata retrieval compiled into native Rust.
- **Microsecond Clock Precision**: Polls active media players in under 3ms with zero terminal flash, window flicker, or focus stealing.
- **Bi-Directional Drift Correction**: Monotonically tracks audio progression and automatically snaps within 50ms if external player scrubbing creates a delta $> 1.5\text{s}$.
- **State Preservation on Pause**: Freezes active lyrics, album artwork, and turntable rotation when media is paused without dropping into the "Not Playing" standby view.

---

## 2. Category 1: Interface & Theme

### 2.1 Modal Glass Blur (`modalGlassBlur`)
- **Function**: Controls the backdrop blur intensity of the settings modal window.
- **Range**: Stepper slider from `0 px` to `60 px` (Default: `28 px`).
- **Details**: Applies GPU-accelerated CSS `backdrop-filter: blur(Xpx)`. Low values offer crisp translucency; high values yield creamy frosted glass dispersion.

### 2.2 Interface Glass Opacity (`modalGlassOpacity`)
- **Function**: Regulates the background tint opacity of the modal dialog box.
- **Range**: Stepper slider from `0%` to `100%` (Default: `75%`).

### 2.3 Master Theme (`theme`)
- **Options**:
  - `Auto (Album Art)` *(Default)*: Dynamically samples the active song's album artwork and generates an adaptive theme with high-contrast text and glowing accents tailored to the track.
  - `Dark`: Enforces a deep midnight obsidian appearance (`#121214`) with translucent glass buttons and crisp white active highlights.
  - `Light`: Enforces a clean daytime appearance (`#f5f5f7`) with dark slate typography (`#111113`) complying with strict WCAG contrast specifications.

### 2.4 Background Render Style (`background`)
- **Options**:
  - `Isolation (Beta)` *(Default)*: Vignette spotlight focused on the centered album artwork, creating an intimate theater backdrop.
  - `Dynamic`: Smoothly drifting multi-color blurred canvas derived from active cover hues.
  - `Dynamic (Beating)`: Senses musical tempo and pulses canvas saturation in rhythm with playback.
  - `3D Fluid Aurora`: Organic floating light mesh running on HTML5 Canvas at 60 FPS.
  - `Apple Music`: Saturated fluid multi-color blur mirroring the Apple Music for macOS aesthetic.
  - `Static`: A non-animated dimmed backdrop optimized for minimal resource usage.

### 2.5 Palette Extraction Algorithm (`paletteAlgorithm`)
- **Options**:
  - `Auto (Beta)` *(Default)*: Adaptive scoring filter selecting vibrant, readable accents while rejecting muddy neutrals.
  - `KMeans`: Multi-cluster mathematical K-Means analysis across the pixel field.
  - `OctTree`: Hierarchical spatial decomposition with ultra-fast color extraction.
  - `MedianCut (Preset 1 & 2)`: Standard and deep-contrast median cut box quantization.

---

## 3. Category 2: Lyrics & Kinetic Motion

### 3.1 Blur Inactive Lyrics (`blurLyrics`)
- **Function**: Applies optical depth-of-field blur to non-active upcoming and completed verses to focus on the active lyric.
- **Levels**:
  - `Level 1 (Subtle)`: `1.8px` — Gentle optical defocus.
  - `Level 2 (Normal)`: `3.5px` — Balanced focus.
  - `Level 3 (Apple Music)`: `6.0px` — Prominent depth of field.
  - `Level 4 (Strong)`: `8.0px` — Heavy cinematic focus.
  - `Level 5 (Maximum)`: `11.0px` — Abstract ambient color clouds.

### 3.2 Auto-Unblur on Hover (`autoUnblur`)
- **Function**: Temporarily lifts the blur on all lyric lines when the cursor hovers over the lyric scroller, allowing you to read upcoming or past verses without losing playback sync.

### 3.3 Typography Presets (`fontPreset`)
- **Presets**:
  - `Spotify Circular` *(Default)*: Clean geometric grotesque sans.
  - `Editorial Serif`: Apple TV & Espresso serif typography (`New York`, `Playfair Display`, `Georgia`).
  - `Spotify Mix`: Modern dynamic sans.
  - `SF Pro Display`: Apple San Francisco system UI typography.
  - `Rounded Bubble`: Pillowed bubble grotesque (`SF Pro Rounded`).
  - `Custom`: Custom system font specified by the user.

### 3.4 Kinetic Movement Options (`lyricMovement`)
- **Options**:
  - `Apple TV Kinetic (Default)`: Kinetic vertical spring drift that gently rolls lines into center focus.
  - `Cinematic Center Snap`: Snaps each singing line directly into the vertical center with subtle scaling.
  - `Floating Wave Drift`: Adds organic horizontal sinusoidal swaying to verses.
  - `Elastic Spring Pop`: Bouncy mechanical spring animation on line transitions.
  - `Smooth Fade & Glide`: Classic linear fade transition.

### 3.5 Dynamic Syllable Word Shine (`wordShine`)
- **Function**: Sweeps an iridescent highlight sheen across words as they are vocalized in word-by-word karaoke mode.

---

## 4. Category 3: Lyric Sources & Priority Order

Nocturne features a multi-tiered provider cascade. If a track is unavailable on one provider, it automatically queries the next configured source:

### 4.1 General Lyrics Priority Order (`lyricSourcesPriority`)
- **LRCLIB**: Open-source community database with millisecond-precision synced lyrics.
- **NetEase Cloud Music**: Massive global database with high-precision line sync and international coverage.
- **Spotify Color Lyrics**: Official Spotify line-by-line synced lyrics.
- **Kugou Music**: Comprehensive catalog with extensive East Asian and international coverage.
- **Musixmatch**: Large commercial lyrics provider.
- **Genius**: Verified lyrics, transcriptions, and annotations.

### 4.2 Karaoke Word-by-Word Priority Order (`karaokeSourcesPriority`)
- **NetEase Cloud Music**: NetEase YRC word timestamps.
- **Spotify**: Syllable-synced word color timing.
- **Kugou Music**: KRC character-by-character timing.
- **LRCLIB**: Progressive sweep fallback.

---

## 5. Category 4: Visual Effects & Audio Visualizer

### 5.1 Real-Time Audio Spectrum Visualizer (`spectrumVisualizer`)
- **Function**: Directly connected to the Web Audio `AudioContext` and `AnalyserNode` during native HQ audio playback. Analyzes real audio frequency bins (FFT size 512, smoothing constant 0.8) to render authentic, real-time responsive visualizers.
- **Styles (`spectrumStyle`)**:
  - `Bars (Classic)`: 32-band vertical equalizer bars with dynamic peak caps.
  - `Waveform (Fluid)`: Undulating harmonic audio ribbon.
  - `Ambient Pulse`: Reactive spherical aura pulsing with musical energy.

### 5.2 Instrumental Break Indicator (`instrumentalBreaks`)
- **Function**: Automatically detects musical intros, guitar solos, or bridge sections ($> 4\text{s}$ without lyrics) and renders a glowing 4-dot countdown timer indicating remaining seconds until vocals resume.

### 5.3 Vinyl Turntable Mode (`vinylMode`)
- **Function**: Transforms the album art into a spinning physical vinyl record with anisotropic light reflection, center label art, and a tone-arm that automatically lifts when paused.
- **Styles**: `Turntable Deck` (full platter & arm) and `Sleeve Slide-Out` (record emerging from jacket).

### 5.4 Aurora Mesh & Ambient Stardust
- **3D Aurora Mesh Orbs**: Floating multi-colored light blobs running on a dedicated canvas layer.
- **Ambient Stardust**: Microscopic cosmic particles gently floating upward with breathing twinkle.

---

## 6. Category 5: Playback, MPRIS & Lossless Audio Engine

### 6.1 Dynamic Media Player Selector (`preferredMediaPlayer`)
- **Auto-Detect**: Discovers the active player emitting D-Bus playback events over `playerctl -l`.
- **Targeted Selection**: Allows you to lock Nocturne onto a specific player (e.g. `spotify`, `zen`, `firefox`, `chromium`) when multiple browser tabs or media players are running simultaneously.

### 6.2 HQ Lossless Audio Provider Suite (`hqAudioEnabled`, `hqQuality`)
- **Source**: Native Kuwo Music search querying a local self-hosted `lx-music-api-server` Docker container on `http://127.0.0.1:8080`.
- **Quality Tiers**:
  - `Standard (128k)`: 128kbps MP3 stream.
  - `High (320k)`: 320kbps High-Bitrate MP3 stream.
  - `Lossless (FLAC)`: 16-bit 44.1kHz / 48kHz CD-Quality Lossless FLAC stream.
  - `Hi-Res (24-bit FLAC)`: 24-bit 96kHz+ Studio Master Lossless FLAC stream.
- **Automated Downgrade Loop**: If a requested tier (such as 24-bit Hi-Res) is unavailable or restricted, the resolver cascades automatically (`HiRes -> Lossless -> High -> Standard`) and notifies you via toast notification rather than aborting.
- **ID Normalization**: Automatically strips upstream `MUSIC_` prefixes (e.g. `MUSIC_626896065` $\to$ `626896065`) to ensure 200 OK responses from the API server.
- **Embedded Proxy**: An internal loopback proxy running in Rust (`hq_proxy.rs`) bypasses CDN referer and CORS restrictions for smooth native `<audio>` playback.
- **Targeted Browser Pausing**: When native HQ playback begins, Nocturne sends an automated pause command to the active browser media player to prevent overlapping audio.

### 6.3 Multi-Tier High-Resolution Artwork Pipeline
- **Primary Source**: iTunes Search API ($600\times600$).
- **High-Res Fallback**: Deezer Search API cover extraction (`cover_xl`, $1000\times1000$).
- **Title Fallback Parsing**: Automatically extracts artist and track names from window titles containing delimiters (`-`, `–`, `—`) when browser MPRIS data lacks separate artist tags.

### 6.4 Sync Offset Calibration (`syncOffsetMs`)
- **Function**: Millisecond-level calibration slider (`-2000ms` to `+2000ms`) with a `Reset (0ms)` button to compensate for Bluetooth latency or external speaker delays.

---

## 7. Category 6: Performance & Diagnostics

- **Live FPS Counter**: Transparent overlay monitoring rendering performance (60 FPS / 120 FPS target).
- **GPU Acceleration Detection**: Identifies integrated vs. discrete GPUs.
- **Memory Footprint**: Displays heap allocation and includes a **"Purge Memory Cache"** button.
- **Rolling Latency Benchmarks**: Real-time rolling table displaying transit latency for lyric fetching, track skips, and scrubber seeks.

---

## 8. Hidden & Pro Features

- **Invisible Quick Provider Switcher**: Hover your mouse near the top-right corner to reveal contextual buttons (`Lyrics: [SOURCE]` and `Karaoke: [SOURCE]`) to override providers for the active song.
- **Two-Phase Variant Search**: Automatically handles `(Remix)`, `(Acoustic)`, `(Sped Up)`, or `(Slowed + Reverb)` tracks by searching for the exact modified version first, falling back cleanly to the original version if no variant lyrics exist.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause.
  - `Right Arrow` / `Left Arrow`: Skip Next / Previous.
  - `Esc`: Close Settings modal.
