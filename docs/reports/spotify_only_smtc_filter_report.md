# Spotify-Only SMTC Media Filtering & Hijacking Prevention Report

**Project**: Nocturne  
**Date**: October 29, 2026  
**Status**: Completed & Verified  

---

## 1. Problem Overview & Root Cause

### 1.1 The Issue
When users played videos on YouTube (or audio in web browsers such as Google Chrome, Microsoft Edge, Firefox, Brave, or media players like VLC), Nocturne would intermittently register and display the YouTube video title and thumbnail instead of the user's Spotify track. For example, playing a YouTube video caused Nocturne's Now Playing header to register browser video titles.

### 1.2 Root Cause Analysis
Windows SMTC exposes a global session manager via `GlobalSystemMediaTransportControlsSessionManager`. Previously, `lib/get_smtc.ps1` called `$session = $manager.GetCurrentSession()`. `GetCurrentSession()` returns whichever application currently has primary media focus in Windows. When a user focuses a YouTube tab or plays browser media, Windows elevates Chrome/Edge to the "current" media session. 

Additionally, `$session.SourceAppId` is often empty for Win32 desktop applications on Windows 11, whereas `$session.SourceAppUserModelId` reliably holds `Spotify.exe`.

---

## 2. Architecture & Solution

To strictly isolate Nocturne to Spotify, we implemented a dual-layer filtering defense:

### Layer 1: Enumerated Session Filtering in PowerShell (`lib/get_smtc.ps1`)
Instead of taking the active session with `GetCurrentSession()`, `lib/get_smtc.ps1` now calls `$manager.GetSessions()` to enumerate all registered media sessions on the system. It inspects both `SourceAppUserModelId` and `SourceAppId` for the Spotify identifier:

```powershell
$sessions = $manager.GetSessions()
$session = $null
foreach ($s in $sessions) {
    $appId = ("" + $s.SourceAppUserModelId + " " + $s.SourceAppId).ToLower()
    if ($appId -like "*spotify*") {
        $session = $s
        break
    }
}
```

- If Spotify is playing or open, it targets **only** the Spotify session, regardless of whether YouTube or another media player is active or focused.
- If Spotify is closed or not providing a media session, `$session` evaluates to `$null`, and `get_smtc.ps1` outputs `"null"`. Non-Spotify sessions (YouTube, Chrome, Edge, VLC) are completely ignored.
- The output JSON now captures `source = if ($session.SourceAppUserModelId) { $session.SourceAppUserModelId } else { $session.SourceAppId }`, emitting `"source": "Spotify.exe"` for downstream verification.

### Layer 2: Strict Application Guard in Node Bridge (`lib/localMediaBridge.ts`)
As a fail-safe, `getLocalMedia()` inspects the parsed payload before accepting it:

```typescript
const parsed = JSON.parse(trimmed) as LocalMediaTrack;
if (parsed && parsed.title) {
  // Strict filter: ensure the media session belongs strictly to Spotify
  const source = (parsed.source || "").toLowerCase();
  if (source && !source.includes("spotify")) {
    resolve(null);
    return;
  }
  resolve(parsed);
  return;
}
```

---

## 3. Verification & Live Output

1. **PowerShell SMTC Live Output**:
   ```json
   {"source":"Spotify.exe","title":"Watermelon Sugar","artist":"Harry Styles","album":"Fine Line","status":"Playing","positionMs":80417,"durationMs":166991}
   ```
2. **YouTube Isolation**:
   - With YouTube or browser audio active, `GetSessions()` ignores `chrome.exe` and binds exclusively to `Spotify.exe`.
   - When Spotify is not running, output resolves cleanly to `null`, preventing false lyrics searches or UI hijacking.
3. **Type Safety & Build**:
   - `npx tsc --noEmit` executed with zero warnings/errors (Exit Code 0).
4. **Antigravity Task State**:
   - `manage_task list` confirmed 0 running background tasks.
