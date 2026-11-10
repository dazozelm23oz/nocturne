# Tauri 2.0 Native Desktop App Migration Report

## Executive Summary
This report documents the migration of **Lirics** from a browser/kiosk wrapper to a native **Tauri 2.0 desktop application** running directly on Windows with Microsoft Edge WebView2 and the MSVC C++ toolchain.

Per strict user direction, the application scope was preserved with zero unnecessary tabs, playlists, or side panels: it is solely and purely focused on the live synchronized lyrics experience (cover artwork, spinning vinyl turntable, synchronized fluid typography, riff wavy progress bar, instrumental countdown dots, fluid aurora 3D mesh, and ambient stardust).

---

## 1. Technical Architecture

```mermaid
flowchart TD
    subgraph TauriHost ["Tauri 2.0 Native Shell (Rust / MSVC)"]
        Tao["Tao (Native Windowing System)"]
        Wry["Wry (Edge WebView2 Wrapper)"]
        App["Lirics Native Executable (app.exe - 8.8MB)"]
    end

    subgraph Webview ["High-Performance Native WebView2"]
        UI["Pure Live Lyrics Player UI"]
        CanvasMesh["Fluid Aurora 3D Mesh (Canvas 60fps)"]
        Stardust["Ambient Stardust Engine (Canvas)"]
        RiffBar["Riff Wavy Scrubber (Canvas)"]
        Turntable["Vinyl Turntable Animation"]
    end

    subgraph LocalEngine ["Local Dual-Engine Backend (127.0.0.1:3000)"]
        PosAPI["/api/spotify/pos"]
        SMTCBridge["lib/localMediaBridge.ts (SMTC WinRT)"]
        MediaKeyBridge["lib/media_control.ps1 (Virtual Keys)"]
    end

    App --> Tao
    Tao --> Wry
    Wry --> UI
    UI --> CanvasMesh
    UI --> Stardust
    UI --> RiffBar
    UI --> Turntable
    UI --> LocalEngine
    LocalEngine --> SMTCBridge
    LocalEngine --> MediaKeyBridge
```

---

## 2. Toolchain & Environment Configuration

| Component | Version | Status |
| :--- | :--- | :--- |
| **Rust Compiler (rustc)** | 1.99.1 (MSVC) | Verified |
| **Cargo Package Manager** | 1.99.1 | Verified |
| **Tauri Core Crates** | 2.12.5 | Compiled & Linked |
| **Tauri CLI (`@tauri-apps/cli`)** | 2.12.4 | Configured |
| **Microsoft C++ Build Tools** | VS BuildTools 18.11 (2026/2022) | Installed & Verified |
| **Windows SDK** | 10.0.26100 (Windows 11) | Installed & Verified |
| **WebView2 Runtime** | 156.0.4314.50 | Verified |

---

## 3. Resolving the Windows Build Bottlenecks

### 3.1 Missing C++ Linker & Windows SDK Import Libraries
- **Issue**: Rust initially failed with `linker link.exe not found` and `could not open 'kernel32.lib'`.
- **Resolution**: Installed `Microsoft.VisualStudio.BuildTools` with the `VCTools` workload and the `Win11SDK_10.0.26100` via Windows Package Manager (`winget`). Verified compiler binaries `cl.exe` and `link.exe` in `VC\Tools\MSVC\14.51.36231\bin\Hostx64\x64`.

### 3.2 MSVC PDB Size Limit (LNK1318) & Disk Space Low
- **Issue**: MSVC linker reported `fatal error LNK1318: Unexpected PDB error; LIMIT (12)` caused by writing >4GB debug PDB files on a low disk space partition (OS error 112).
- **Resolution**:
  1. Configured `[profile.dev]` in `src-tauri/Cargo.toml` with `debug = 1` and `incremental = false` to eliminate redundant debug symbol blobs while preserving full line-table stack traces.
  2. Executed cleanup of temporary installer packages and intermediate build artifacts, reclaiming over **5.7 GB** of free space on `C:`.

---

## 4. Binary Sizes & Performance

| Artifact | Size | Link Time | Startup Latency |
| :--- | :--- | :--- | :--- |
| **Debug Binary (`target/debug/app.exe`)** | 11.6 MB | 2m 13s | < 0.25s |
| **Optimized Release Binary (`target/release/app.exe`)** | **8.8 MB** | 2m 59s | **< 0.10s** |

---

## 5. Launch & Development Commands

```bash
# Launch development desktop app with live reload
npm run desktop

# Run the compiled release desktop app directly
npm run desktop:run

# Or launch via PowerShell / Batch scripts
./run-desktop.ps1
run-desktop.bat

# Build production bundle / installer
npm run desktop:build
```
