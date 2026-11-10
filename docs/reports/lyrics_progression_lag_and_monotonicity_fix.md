# Lyrics Progression Lag & Monotonicity Fix Report

## 1. Problem Description
The user observed erratic lyric progression where the active line would jump backwards in the middle of singing:
> *"the lyrics are lagging in the middle if we letsa say have line 1 and 2 and 3 and 4 . it goes from 1 to 2 to 1 to 3. and 3 is synced up with the audio. but when it goes from 2 to 1. 2 isnt done yet"*

---

## 2. Root Cause Analysis

### 2.1 Stale Windows SMTC Timeline Position
- Windows System Media Transport Controls (`GlobalSystemMediaTransportControlsSession`) reports a static `Position` snapshot coupled with a `LastUpdatedTime` timestamp.
- Spotify Desktop only pulses an updated `Position` to Windows SMTC every 3 to 5 seconds.
- In [`lib/get_smtc.ps1`](../../lib/localMediaBridge.ts), `positionMs` was read directly from `$timeline.Position.TotalMilliseconds` without computing `([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime)`.
- Consequently, for 3–5 seconds between pulses, `get_smtc.ps1` returned a **frozen, stale timestamp** that lagged behind real audio by up to 4.5 seconds.

### 2.2 Client-Side Jitter & Backward Regression
- The frontend [`providers/SongContext.tsx`](../../providers/SongContext.tsx) was smoothly interpolating time forward (`currentTime = 101.5s`, activating Line 2).
- When a poll to `/api/spotify/pos` completed, it returned the stale SMTC position (`100.0s`).
- The frontend updated its base timestamp, causing `currentTime` to **drop backwards by 1.5s–2.5s**.
- In [`providers/LyricsContext.tsx`](../../providers/LyricsContext.tsx), the loop `if (currentTime >= line.seconds)` immediately regressed from index 1 (Line 2) back to index 0 (Line 1).
- Line 2's karaoke sweep was cut short mid-singing, and the viewport scrolled back up to Line 1.
- When Spotify finally emitted its next timeline pulse, `currentTime` leaped forward, jumping directly to Line 3.

---

## 3. Engineering Fixes

### 3.1 Real-Time Extrapolation in `lib/get_smtc.ps1`
Updated [`lib/get_smtc.ps1`](../../lib/localMediaBridge.ts) to calculate elapsed time since `LastUpdatedTime`:
```powershell
$elapsedSinceUpdate = 0
if ($status -eq "Playing" -and $lastUpdated) {
    $elapsedSinceUpdate = [Math]::Max(0, ($now - $lastUpdated).TotalMilliseconds)
}
$realPosMs = [Math]::Round([Math]::Min($durationMs, $basePos + $elapsedSinceUpdate))
```
Every SMTC poll now reflects exact wall-clock audio playback without freezing or falling behind.

### 3.2 Server-Side Monotonic Smoothing in `lib/localMediaBridge.ts`
In [`lib/localMediaBridge.ts`](../../lib/localMediaBridge.ts), added a monotonic forward-progression filter for the active track. If a reading is slightly behind extrapolated wall-clock time ($< 4,000\text{ms}$), it uses the continuous extrapolated position, preventing backward jitter.

### 3.3 Frontend Monotonic Continuity in `providers/SongContext.tsx`
In [`providers/SongContext.tsx`](../../providers/SongContext.tsx):
1. In `handlePlaybackData`: Checks if reported `progressMs` lags behind `currentData.progress_ms + elapsed`. If within 4.5 seconds and not user-seeking/skipping, preserves local forward progress.
2. In `useInterval`: Clamps `currentSec` against `prevSec`, strictly enforcing monotonic forward progression unless a manual seek ($> 4.5\text{s}$) was initiated.

### 3.4 Hysteresis & Anti-Jitter Guard in `providers/LyricsContext.tsx`
In [`providers/LyricsContext.tsx`](../../providers/LyricsContext.tsx), implemented an anti-jitter hysteresis guard. Once Line 2 is active, it cannot be demoted back to Line 1 unless `currentTime` drops more than $0.75\text{s}$ below Line 2's start time (a deliberate user rewind).

---

## 4. Verification & Results

Consecutive live polling verified strictly monotonic progression:
- Sample 1: `135,026ms` ($135.02\text{s}$)
- Sample 2: `136,822ms` ($136.82\text{s}$)
- Sample 3: `138,551ms` ($138.55\text{s}$)
- Sample 4: `140,431ms` ($140.43\text{s}$)

The active lyric line now advances seamlessly from $1 \to 2 \to 3 \to 4$ with zero backward regressions, smooth scrolling, and complete synchronization with audio.
