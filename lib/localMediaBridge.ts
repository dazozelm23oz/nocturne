import { invoke } from "@tauri-apps/api/core";
import { cleanTrackTitle, sanitizeTrackForSearch } from "@/lib/trackVariants";
import { resilientFetchJson } from "@/lib/resilientFetch";

export interface LocalMediaTrack {
  source: string | null;
  title: string;
  artist: string;
  album: string;
  status: "Playing" | "Paused" | "Stopped" | string;
  positionMs: number;
  durationMs: number;
}

let lastSmtcResult: any = null;
let lastSmtcTimestamp = 0;
let lastTrackId: string | null = null;
let lastKnownPosMs = 0;
let lastKnownPosTimestamp = 0;

export async function getActivePlayers(): Promise<string[]> {
  try {
    const players = await invoke<string[]>("get_mpris_active_players");
    return Array.isArray(players) ? players : [];
  } catch (e) {
    return [];
  }
}

export async function getLocalMedia(targetPlayer?: string): Promise<LocalMediaTrack | null> {
  try {
    const playerParam = targetPlayer && targetPlayer !== "auto" ? targetPlayer : undefined;
    const output = await invoke<string>("get_mpris_playback_state", { player: playerParam });
    
    console.log("RAW MPRIS OUTPUT:", output);

    if (!output || output.trim() === "" || output.includes("No player could handle this command")) {
      return null;
    }
    
    const parts = output.trim().split("|");
    if (parts.length < 3) return null;

    // The last 3 items are always: [status, position_us, length_us]
    const lenStr = parts[parts.length - 1] || "0";
    const posStr = parts[parts.length - 2] || "0";
    const status = parts[parts.length - 3] || "Playing";

    const cleanStatus = (status || "").trim().toLowerCase();

    // If the player is paused, seeking, or buffering, and it reports "YouTube Music" as the title, do not update the state.
    if ((cleanStatus === "paused" || cleanStatus === "buffering") && output.toLowerCase().includes("youtube music")) {
      return lastSmtcResult ? lastSmtcResult.item : null;
    }

    // If MPRIS status is Stopped or empty, treat as not playing / null
    if (!cleanStatus || cleanStatus === "stopped") {
      lastSmtcResult = null;
      lastTrackId = null;
      return null;
    }

    // Helper to strip platform and browser title noise BEFORE searching
    const stripPlatformSuffixes = (str: string) => {
      return (str || "")
        .replace(/\s*\|\s*YouTube(?:\s*Music)?.*$/i, "")
        .replace(/\s*[-–—]\s*YouTube(?:\s*Music)?.*$/i, "")
        .replace(/\s*\|\s*Topic.*$/i, "")
        .replace(/\s*[-–—]\s*Topic.*$/i, "")
        .replace(/\s*\|\s*Spotify.*$/i, "")
        .replace(/\s*[-–—]\s*Spotify.*$/i, "")
        .replace(/\s*\|\s*Apple(?:\s*Music)?.*$/i, "")
        .replace(/\s*[-–—]\s*Apple(?:\s*Music)?.*$/i, "")
        .trim();
    };

    // The items to the left of [status, position_us, length_us] represent title and optional artist
    const metaParts = parts.slice(0, parts.length - 3).map((p) => p.trim()).filter((p) => p.length > 0);

    let rawTitle = "";
    let rawArtist = "";

    if (metaParts.length === 1) {
      rawTitle = stripPlatformSuffixes(metaParts[0]);
      rawArtist = "";
    } else if (metaParts.length >= 2) {
      const candidateArtist = metaParts[metaParts.length - 1];
      if (/^(?:youtube(?:\s*music)?|spotify|topic|unknown(?:\s*artist)?)$/i.test(candidateArtist)) {
        rawTitle = stripPlatformSuffixes(metaParts.slice(0, -1).join(" | "));
        rawArtist = "";
      } else {
        rawArtist = candidateArtist;
        rawTitle = stripPlatformSuffixes(metaParts.slice(0, -1).join(" | "));
      }
    }

    // Strip platform noise from rawTitle first so it doesn't pollute splitting
    let workingTitle = stripPlatformSuffixes(rawTitle);

    // If the status is "Paused", and the workingTitle is exactly "YouTube Music" or matches random ad titles,
    // do NOT update the title/artist. Return the previously cached lastSmtcResult so the screen stays frozen on the actual song.
    const isPaused = (cleanStatus || "").toLowerCase() === "paused";
    const isGenericOrAd =
      !workingTitle ||
      /^(?:youtube(?:\s*music)?|spotify|advertisement|audio\s*ad|beatmasters(?:\s*vol\s*\d+)?)$/i.test(workingTitle.trim());

    if (isPaused && isGenericOrAd && lastSmtcResult) {
      return {
        source: "mpris",
        title: lastSmtcResult.item?.name || workingTitle,
        artist: lastSmtcResult.item?.artists?.[0]?.name || "Unknown Artist",
        album: lastSmtcResult.item?.album?.name || "",
        status: "Paused" as any,
        positionMs: lastSmtcResult.progress_ms || 0,
        durationMs: lastSmtcResult.item?.duration_ms || 180000,
      };
    }

    // If artist is empty, platform branding, or Unknown Artist, split title by hyphens or pipes
    if (!rawArtist || /^(?:unknown(?:\s*artist)?|youtube(?:\s*music)?|spotify|topic)$/i.test(rawArtist)) {
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

    // Clean platform pollution & parentheticals (e.g. "(Official Music Video)")
    const sanitized = sanitizeTrackForSearch(workingTitle, rawArtist);
    let title = stripPlatformSuffixes(sanitized.title || cleanTrackTitle(workingTitle) || workingTitle || rawTitle);
    
    let artist = sanitized.artist;
    if (!artist && rawArtist && !/^(?:youtube(?:\s*music)?|spotify|topic)$/i.test(rawArtist.trim())) {
      artist = cleanTrackTitle(rawArtist);
    }
    if (!artist || !artist.trim() || /^(?:unknown(?:\s*artist)?|youtube(?:\s*music)?|spotify|topic)$/i.test(artist.trim())) {
      const stripped = (workingTitle || title || rawTitle)
        .replace(/\s*(\((?:feat\.?|ft\.?).*?\)|\b(?:feat\.?|ft\.?)\b.*|[-–—|].*)$/i, "")
        .trim();
      title = stripPlatformSuffixes(stripped || title);
      artist = title; // If the artist is empty, pass the title as the fallback artist
    }

    if (!title) return null;

    // playerctl returns microseconds, convert to milliseconds
    const pos = parseInt(posStr || "0", 10) / 1000;
    const len = parseInt(lenStr || "0", 10) / 1000;

    return {
      source: "mpris",
      title: title,
      artist: artist,
      album: "",
      status: status as any,
      positionMs: isNaN(pos) ? 0 : pos,
      durationMs: isNaN(len) ? 0 : len,
    };
  } catch (e) {
    return null;
  }
}

const artworkCache = new Map<string, string>();

export async function getArtworkForTrack(title: string, artist: string): Promise<string> {
  const cleanTitle = cleanTrackTitle(title);
  const cleanArtist = artist && artist !== "Unknown Artist" ? cleanTrackTitle(artist) : "";
  const cacheKey = `${cleanTitle}_${cleanArtist}`.toLowerCase().trim();

  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey)!;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`art_${cacheKey}`);
      if (stored) {
        artworkCache.set(cacheKey, stored);
        return stored;
      }
    } catch {}
  }

  // 1. Try iTunes search first
  try {
    const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim()).replace(/%20/g, "+");
    const itunesUrl = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    const res = await resilientFetchJson<any>(itunesUrl, {
      timeoutMs: 6000,
      retries: 1,
      headers: typeof window === "undefined" ? { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } : undefined,
      silent: true,
    });

    if (res.ok && res.data?.results?.[0]?.artworkUrl100) {
      const highRes = res.data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
      artworkCache.set(cacheKey, highRes);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`art_${cacheKey}`, highRes);
        } catch {}
      }
      return highRes;
    }
  } catch {}

  // 2. Fallback to Deezer API for high-resolution cover
  try {
    const deezerQuery = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
    const deezerUrl = `https://api.deezer.com/search?q=${deezerQuery}`;
    const dzRes = await resilientFetchJson<any>(deezerUrl, {
      timeoutMs: 6000,
      retries: 1,
      silent: true,
    });
    if (dzRes.ok && dzRes.data?.data?.[0]?.album?.cover_xl) {
      const cover = dzRes.data.data[0].album.cover_xl;
      artworkCache.set(cacheKey, cover);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`art_${cacheKey}`, cover);
        } catch {}
      }
      return cover;
    }
  } catch {}

  return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80";
}

export async function getLocalPlaybackState(targetPlayer?: string): Promise<any> {
  const now = Date.now();
  if (lastSmtcResult && now - lastSmtcTimestamp < 400) {
    return {
      ...lastSmtcResult,
      progress_ms: lastSmtcResult.progress_ms + (lastSmtcResult.is_playing ? now - lastSmtcTimestamp : 0),
      timestamp: now,
    };
  }

  const media = await getLocalMedia(targetPlayer);
  if (!media || (media.status || "").toLowerCase() === "stopped") {
    lastSmtcResult = null;
    lastTrackId = null;
    return null;
  }

  const trackId = `${media.title}_${media.artist}`.replace(/[^\w]/g, "_");

  let resolvedPosMs = media.positionMs || 0;
  if (lastTrackId === trackId && media.status === "Playing" && lastKnownPosTimestamp > 0) {
    const elapsedSinceLast = now - lastKnownPosTimestamp;
    if (resolvedPosMs < lastKnownPosMs && lastKnownPosMs - resolvedPosMs < 4000) {
      resolvedPosMs = lastKnownPosMs + elapsedSinceLast;
    } else {
      lastKnownPosMs = resolvedPosMs;
      lastKnownPosTimestamp = now;
    }
  } else {
    lastTrackId = trackId;
    lastKnownPosMs = resolvedPosMs;
    lastKnownPosTimestamp = now;
  }

  const artwork = await getArtworkForTrack(media.title, media.artist);

  const result = {
    item: {
      name: media.title,
      artists: [{ name: media.artist }],
      album: {
        name: media.album || media.title,
        images: [{ url: artwork }],
      },
      duration_ms: media.durationMs || 180000,
      uri: `mpris:track:${trackId}`,
      explicit: false,
    },
    is_playing: (media.status || "").toLowerCase() === "playing",
    progress_ms: resolvedPosMs,
    timestamp: now,
  };

  lastSmtcResult = result;
  lastSmtcTimestamp = now;
  return result;
}

export async function sendLocalMediaCommand(
  action: "next" | "prev" | "playpause" | "play" | "pause",
  targetPlayer?: string
): Promise<boolean> {
  try {
    const playerParam = targetPlayer && targetPlayer !== "auto" ? targetPlayer : undefined;
    await invoke("send_mpris_command", { action, player: playerParam });
    return true;
  } catch (e) {
    return false;
  }
}

export async function seekLocalMedia(positionMs: number, targetPlayer?: string): Promise<boolean> {
  try {
    const playerParam = targetPlayer && targetPlayer !== "auto" ? targetPlayer : undefined;
    await invoke("seek_mpris_media", { positionMs: Math.round(positionMs), player: playerParam });
    return true;
  } catch (e) {
    return false;
  }
}
