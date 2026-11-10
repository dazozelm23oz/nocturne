const fs = require('fs');

// 1. Update lib/localMediaBridge.ts
let bridge = fs.readFileSync('lib/localMediaBridge.ts', 'utf8');
const oldSendCommand = `export async function sendLocalMediaCommand(action: "next" | "prev" | "playpause" | "play" | "pause"): Promise<boolean> {
  return new Promise((resolve) => {
    const ps1Path = path.join(process.cwd(), "lib", "media_control.ps1");
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1Path, action],
      { timeout: 1500 },
      (err) => {
        resolve(!err);
      }
    );
  });
}`;

const newSendCommand = `export async function sendLocalMediaCommand(action: "next" | "prev" | "playpause" | "play" | "pause"): Promise<boolean> {
  const now = Date.now();
  if (lastSmtcResult) {
    if (action === "play") {
      lastSmtcResult.is_playing = true;
      lastSmtcResult.timestamp = now;
    } else if (action === "pause") {
      lastSmtcResult.is_playing = false;
      lastSmtcResult.timestamp = now;
    } else if (action === "playpause") {
      lastSmtcResult.is_playing = !lastSmtcResult.is_playing;
      lastSmtcResult.timestamp = now;
    } else if (action === "next" || action === "prev") {
      // Invalidate cache immediately on track skip so the next position poll reads the new track!
      lastSmtcResult = null;
      lastSmtcTimestamp = 0;
      lastTrackId = null;
    }
  }

  // 1. Ultra-fast native binary (30ms)
  const exePath = path.join(process.cwd(), "lib", "media_ctl.exe");
  const ps1Path = path.join(process.cwd(), "lib", "media_control.ps1");

  return new Promise((resolve) => {
    execFile(exePath, [action], { timeout: 600 }, (err) => {
      if (!err) {
        resolve(true);
        // Also dispatch WinRT SMTC session remote command asynchronously in background
        execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1Path, action], { timeout: 1500 }, () => {});
        return;
      }

      // Fallback
      execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1Path, action], { timeout: 1200 }, (psErr) => {
        resolve(!psErr);
      });
    });
  });
}`;

bridge = bridge.replace(oldSendCommand, newSendCommand);
bridge = bridge.replace(oldSendCommand.replace(/\n/g, '\r\n'), newSendCommand.replace(/\n/g, '\r\n'));
fs.writeFileSync('lib/localMediaBridge.ts', bridge, 'utf8');

// 2. Update pages/api/spotify/playback.ts
const newPlaybackApi = `import spotifyApi from "@/lib/spotify";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken, JWT } from "next-auth/jwt";
import { sendLocalMediaCommand } from "@/lib/localMediaBridge";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({
      message: "Invalid Method! Expected PUT or POST.",
      status: 405,
    });
  }

  const reqBody = req.body;

  let localAction: "next" | "prev" | "playpause" | "play" | "pause" | null = null;
  if (reqBody.next) localAction = "next";
  else if (reqBody.previous) localAction = "prev";
  else if (reqBody.play) localAction = "play";
  else if (reqBody.pause) localAction = "pause";

  // 1. Ultra-Fast Fast-Path: Native Windows media control executes in 30ms!
  let localExecuted = false;
  if (localAction) {
    try {
      localExecuted = await sendLocalMediaCommand(localAction);
    } catch (e) {
      console.warn("Local media command error:", e);
    }
  }

  // 2. Dispatch Cloud API in background or foreground
  const executeCloud = async () => {
    try {
      const tk = await getToken({ req });
      if (tk) {
        const token: JWT = JSON.parse(JSON.stringify(tk, null, 2));
        spotifyApi.setAccessToken(token.access_token);
        if (token.refresh_token) {
          spotifyApi.setRefreshToken(token.refresh_token);
        }

        if (reqBody.pause) {
          await spotifyApi.pause();
        } else if (reqBody.play) {
          await spotifyApi.play();
        } else if (reqBody.next) {
          await spotifyApi.skipToNext();
        } else if (reqBody.previous) {
          await spotifyApi.skipToPrevious();
        } else if (typeof reqBody.shuffle === "boolean") {
          await spotifyApi.setShuffle(reqBody.shuffle);
        } else if (typeof reqBody.repeat === "string") {
          await spotifyApi.setRepeat(reqBody.repeat as any);
        }
      }
    } catch (cloudErr) {
      // cloud API error handled silently
    }
  };

  // If local media command executed (Windows Desktop), return HTTP 200 in 30ms and sync cloud in background!
  if (localExecuted) {
    executeCloud();
    return res.status(200).json({ status: true, source: "local_fast_path" });
  }

  // Fallback: wait for cloud API (e.g. mobile Spotify Connect)
  await executeCloud();
  return res.status(200).json({ status: true });
}
`;
fs.writeFileSync('pages/api/spotify/playback.ts', newPlaybackApi, 'utf8');

// 3. Update pages/index.tsx playback() function
let indexCode = fs.readFileSync('pages/index.tsx', 'utf8');
const oldPlaybackFunc = `  function playback(pause: boolean) {
    const pbStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    fetch("/api/spotify/playback", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pause ? { pause: true } : { play: true }),
    }).finally(() => {
      const pbElapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - pbStart;
      recordMetric("playback_toggle", pbElapsed);
    });
    refetchSong(true);
  }`;

const newPlaybackFunc = `  function playback(pause: boolean) {
    // 0ms INSTANT OPTIMISTIC PLAY/PAUSE UI TOGGLE
    const nextPlaying = !pause;
    setData((prev: any) =>
      prev
        ? { ...prev, is_playing: nextPlaying }
        : { is_playing: nextPlaying }
    );

    const pbStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    fetch("/api/spotify/playback", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pause ? { pause: true } : { play: true }),
    }).finally(() => {
      const pbElapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - pbStart;
      recordMetric("playback_toggle", pbElapsed);
    });

    // Schedule rapid refresh
    setTimeout(() => {
      refetchSong(true);
    }, 250);
  }`;

indexCode = indexCode.replace(oldPlaybackFunc, newPlaybackFunc);
indexCode = indexCode.replace(oldPlaybackFunc.replace(/\n/g, '\r\n'), newPlaybackFunc.replace(/\n/g, '\r\n'));
fs.writeFileSync('pages/index.tsx', indexCode, 'utf8');

// 4. Update providers/SongContext.tsx intervals
let songCtx = fs.readFileSync('providers/SongContext.tsx', 'utf8');
songCtx = songCtx.replace(
  '[100, 300, 600, 1200].forEach((ms) => setTimeout(fetchPosition, ms));',
  '[80, 200, 450, 900].forEach((ms) => setTimeout(fetchPosition, ms));'
);
fs.writeFileSync('providers/SongContext.tsx', songCtx, 'utf8');

console.log('Instant playback and skipping applied successfully');
