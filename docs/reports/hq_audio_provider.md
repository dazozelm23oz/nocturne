# High-Quality Lossless Audio Provider & Proxy Architecture Report

## 1. Executive Summary
This report details the implementation of Nocturne's **HQ Audio Provider Suite**, enabling high-bitrate ($320\text{kbps}$) and lossless ($16\text{-bit / }24\text{-bit}$ FLAC) audio playback directly synchronized with live karaoke lyrics.

The subsystem integrates:
1. A **Self-Hosted API Connector** (`src-tauri/src/hq_music.rs`) querying Kuwo Music via an `lx-music-api-server` Docker container on `http://127.0.0.1:8080`.
2. An **Automated Quality Downgrade Loop** preventing silent failures by cascading through available audio tiers.
3. A **Local Reverse Proxy** (`src-tauri/src/hq_proxy.rs`) stripping restrictive CDN referrer/CORS headers.
4. A **Dual-Clock Web Audio Bridge** (`lib/useHqPlayback.ts`) powering the real-time spectrum visualizer and driving lyric synchronization.

![HQ Audio UI](/screenshot/hq_audio.png)

---

## 2. Kuwo Resolution & Prefix Normalization (`src-tauri/src/hq_music.rs`)

### A. The `MUSIC_` Identifier Prefix Issue
The Kuwo Music search API returns song identifiers formatted with a prefix (e.g. `MUSIC_626896065`). When forwarded verbatim to the LX Music Docker backend, requests resulted in `HTTP 403 Forbidden` rejections:

```
# Broken Request:
GET /url?source=kw&songId=MUSIC_626896065&quality=flac24bit -> HTTP 403 Forbidden

# Working Request:
GET /url?source=kw&songId=626896065&quality=flac -> HTTP 200 OK
```

To permanently resolve this across all query endpoints, the ID is stripped immediately at the entry point of stream resolution:

```rust
async fn resolve(
    &self,
    source: &str,
    track_id: &str,
    track_title: &str,
    track_artist: &str,
    requested_quality: Quality,
) -> Result<HqStream, HqError> {
    let clean_id = track_id.trim_start_matches("MUSIC_");
    
    let candidate_qualities: Vec<Quality> = match requested_quality {
        Quality::HiRes => vec![Quality::HiRes, Quality::Lossless, Quality::High, Quality::Standard],
        Quality::Lossless => vec![Quality::Lossless, Quality::High, Quality::Standard],
        Quality::High => vec![Quality::High, Quality::Standard],
        Quality::Standard => vec![Quality::Standard],
    };
    ...
```

### B. Cascading Quality Downgrade Loop
If a higher tier is unavailable or rejected by the upstream provider, the resolver attempts each subsequent tier sequentially:

```rust
for quality in candidate_qualities {
    match self.try_resolve(source, clean_id, track_title, track_artist, quality).await {
        Ok(stream) => {
            if quality != requested_quality {
                return Err(HqError::QualityDowngraded {
                    requested: requested_quality.as_str().to_string(),
                    resolved: quality.as_str().to_string(),
                    stream: Box::new(stream),
                });
            }
            return Ok(stream);
        }
        Err(err) => {
            eprintln!("[HQ Downgrade] Quality {:?} failed: {:?}", quality, err);
            continue;
        }
    }
}
```

---

## 3. High-Performance Local Streaming Proxy (`src-tauri/src/hq_proxy.rs`)

Many lossless CDNs enforce strict origin, user-agent, or referer policies that standard browser `<audio>` elements cannot satisfy in a webview environment. Nocturne spawns an embedded local proxy running on an ephemeral loopback port:

```
Browser Webview <audio> -> http://127.0.0.1:[proxy_port]/stream?token=[secure_token]
                                    |
                                    v (Proxied with custom headers)
Upstream Lossless CDN (e.g. Kuwo / Netease FLAC / 320k MP3 Stream)
```

The proxy:
- Injects required upstream headers (`Referer`, `User-Agent: Mozilla/5.0...`).
- Appends permissive CORS headers (`Access-Control-Allow-Origin: *`).
- Enables range requests (`Range: bytes=...`) for instant scrubber seeking and scrubbing.

---

## 4. Web Audio Graph & Time Clock Sync (`lib/useHqPlayback.ts`)

### A. Real-Time Audio Graph
When HQ audio starts, it binds the native `<audio>` element to a Web Audio `AudioContext` and `AnalyserNode`:

```typescript
const initAudioGraph = useCallback((audioEl: HTMLAudioElement) => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;

  const source = ctx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(ctx.destination);

  audioContextRef.current = ctx;
  analyserRef.current = analyser;
}, []);
```

This ensures the `AudioSpectrumVisualizer` displays authentic frequency data corresponding exactly to the audible track.

### B. Dual-Clock Priority Hierarchy
In `providers/SongContext.tsx`, the high-precision `audioEl.currentTime` clock takes precedence over MPRIS polling whenever HQ playback is active:

```typescript
// If native HQ audio is actively playing, use its high-precision currentTime clock
const hqTime = getHqPlaybackTime();
if (hqTime !== null && isHqAudioActive()) {
  setCurrent(hqTime);
  return;
}
```

### C. Automatic Browser Audio Silencing
To eliminate overlapping playback, whenever the native HQ audio stream initializes or resumes, Nocturne dispatches a targeted pause command to the active browser media player:

```typescript
sendLocalMediaCommand("pause", settings.preferredMediaPlayer).catch(() => {});
```
