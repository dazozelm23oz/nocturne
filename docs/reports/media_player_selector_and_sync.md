# Dynamic Media Player Selector & Seeking Synchronization Report

## 1. Executive Summary
This report covers the design and implementation of Nocturne's **Dynamic Media Player Selector** and **Seeking Synchronization Engine**. 

When multiple browser windows or applications play audio simultaneously on Linux (for instance, Spotify running alongside YouTube in Zen Browser or Firefox), generic media transport queries can oscillate between players or capture the wrong session. Furthermore, previous versions suffered from an over-aggressive pause handler that wiped the song display upon pausing and allowed lyric timing to drift out of sync with external player scrubbing.

The solutions implemented:
1. **Dynamic Media Player Selector**: Real-time discovery of active MPRIS D-Bus players via `playerctl -l`, with per-player targeting.
2. **Robust Pause State Retention**: Differentiating between `Paused` (retaining track metadata and freezing the progress counter) and `Stopped` (cleanly resetting to the standby screen).
3. **External & Internal Seeking Synchronization**: Automatic drift snapping whenever external progress differs by $> 1.5\text{s}$, combined with bi-directional scrubber seek commands.

![Media Player Selector & Sync](/screenshot/media_player_selector.png)

---

## 2. Dynamic Player Discovery & D-Bus Targeting

### A. Backend Discovery via Rust (`src-tauri/src/lib.rs`)
The Tauri command `get_mpris_active_players` executes `playerctl -l`, parsing every active MPRIS D-Bus endpoint:

```rust
#[tauri::command]
fn get_mpris_active_players() -> Result<Vec<String>, String> {
    let output = std::process::Command::new("playerctl")
        .arg("-l")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout);
        let players: Vec<String> = text
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        Ok(players)
    } else {
        Ok(vec![])
    }
}
```

### B. Settings Modal Selector (`components/AppleMusicSettingsModal.tsx`)
In the *Sync & Spotify Controls* category, a live dropdown lists all active players alongside an **Auto-detect** mode:

```tsx
<button
  className={`${styles.dropdownButton} ${openDropdown === "mediaPlayer" ? styles.dropdownButtonActive : ""}`}
  onClick={(e) => toggleDropdown("mediaPlayer", e)}
>
  <span>
    {settings.preferredMediaPlayer && settings.preferredMediaPlayer !== "auto"
      ? settings.preferredMediaPlayer
      : "Auto-detect"}
  </span>
</button>
```

When a user selects a player (e.g., `zen.instance_1_420` or `spotify`), all metadata queries, play/pause commands, and seek dispatches append `--player={name}`.

---

## 3. Resolving the Over-Aggressive "Not Playing" State

### The Problem
Previously, `fetchPosition` in `providers/SongContext.tsx` cleared the current track whenever `is_playing` was `false`:

```typescript
// Broken: wiping song immediately on pause!
if (!localMedia || !localMedia.item || !localMedia.is_playing) {
  setSong(null);
  setData(null);
  setCurrent(0);
  return;
}
```
This caused the UI to immediately dump the active song and display the "Not Playing" placeholder whenever playback was paused.

### The Solution
The check was updated to only clear song data if the media object is completely null or MPRIS explicitly reports `Stopped`:

```typescript
// Preserves song and UI while paused; resets only on true stop
if (!localMedia || !localMedia.item) {
  setSong(null);
  setData(null);
  setCurrent(0);
  return;
}

handlePlaybackData(localMedia);
```

When paused, `data.is_playing` is set to `false`, and `useInterval` freezes `current` at the exact elapsed seconds without destroying the active lyrics, vinyl record, or album palette.

---

## 4. Bi-Directional Seeking Synchronization

### A. External Seek & Drift Correction
When a user scrubs or jumps through a track inside their browser or desktop player, Nocturne checks the difference between its local progression timer and the MPRIS `progress_ms`:

```typescript
const isUserSeeking = Date.now() - seekLockRef.current.timestamp < 2500;
if (!isUserSeeking && localMedia.progress_ms !== undefined) {
  const mprisSec = msTosec(localMedia.progress_ms);
  setCurrent((prevSec) => {
    if (Math.abs(prevSec - mprisSec) > 1.5) {
      return mprisSec; // Forcefully snap to the external scrubber position!
    }
    return prevSec;
  });
}
```

### B. Internal Scrubber Dispatches
When the user drags the waveform scrubber in Nocturne, `seekTo` sends an immediate microsecond seek command to the targeted player:

```typescript
const seekTo = useCallback(async (targetSeconds: number) => {
  const targetMs = Math.max(0, Math.round(targetSeconds * 1000));
  const now = Date.now();

  seekLockRef.current = { timestamp: now, expectedMs: targetMs };
  setCurrent(targetSeconds);

  if (isHqAudioActive()) {
    seekHqAudio(targetSeconds);
  }

  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    const preferredPlayer = getPreferredMediaPlayer();
    seekLocalMedia(targetMs, preferredPlayer).catch(() => {});
  }
}, []);
```
This guarantees bidirectional parity between Nocturne and the external audio engine.
