import type { NextApiRequest, NextApiResponse } from "next";
import { getPersistentCache, setPersistentCache } from "@/lib/persistentCache";
import { executePriorityLyricsFetch, LyricProviderResult } from "@/lib/lyricsProviders";
import { LyricSourceId } from "@/lib/lyricsSources";
import { analyzeTrackTitle } from "@/lib/trackVariants";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Expected GET." });
  }

  const {
    track,
    artist = "",
    album = "",
    trackId = "",
    duration = "",
    sources = "",
    karaokeSources = "",
    disabled = "",
    preferKaraoke = "false",
    bypassCache = "false",
    forceSource = "",
  } = req.query as Record<string, string>;

  if (!track) {
    return res.status(400).json({ error: "Missing track from params" });
  }

  const rawTrackId = (trackId || "").replace("spotify:track:", "").trim();
  const isKaraokePreferred = preferKaraoke === "true" || preferKaraoke === "1";
  const numDuration = duration ? parseFloat(duration) : undefined;

  // Analyze title for modified variants: slowed, reverb, remix, sped up, etc.
  const analysis = analyzeTrackTitle(track);

  // Parse custom priorities if provided by the client settings
  let sourcesPriority = sources
    ? (sources.split(",").filter(Boolean) as LyricSourceId[])
    : undefined;
  let karaokeSourcesPriority = karaokeSources
    ? (karaokeSources.split(",").filter(Boolean) as LyricSourceId[])
    : undefined;
  const disabledSources = disabled
    ? (disabled.split(",").filter(Boolean) as LyricSourceId[])
    : undefined;

  // If client requested a single specific source override (e.g. for this song only):
  if (forceSource) {
    const forced = forceSource as LyricSourceId;
    sourcesPriority = [forced];
    karaokeSourcesPriority = [forced];
  }

  // Create primary and secondary cache keys based on exact track requested
  const cacheSuffix = forceSource
    ? `_forced_${forceSource}`
    : isKaraokePreferred
    ? "_karaoke"
    : "";
  const primaryKey = rawTrackId
    ? `id_${rawTrackId}${cacheSuffix}`
    : `${analysis.originalTrack}_${artist || ""}_${album || ""}${cacheSuffix}`;
  const secondaryKey = `${analysis.originalTrack}_${artist || ""}${cacheSuffix}`;

  // 1. FAST-PATH: Persistent Cache Check (0ms local hit!)
  if (bypassCache !== "true") {
    const cached = await getPersistentCache<any>("lyrics", primaryKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        cached: true,
      });
    }

    if (artist) {
      const secondaryCached = await getPersistentCache<any>("lyrics", secondaryKey);
      if (secondaryCached) {
        return res.status(200).json({
          ...secondaryCached,
          cached: true,
        });
      }
    }
  }

  // 2. TWO-PHASE SEARCH:
  // Phase 1: Try exact modified track name (e.g. "Song (Slowed + Reverb)" or "Song (Remix)")
  // Phase 2: If no source has the modified variant, fallback to base song name ("Song")
  let result: LyricProviderResult | null = null;
  let matchedCandidate = analysis.originalTrack;
  let isFallbackToBase = false;

  for (let i = 0; i < analysis.searchCandidates.length; i++) {
    const candidate = analysis.searchCandidates[i];

    result = await executePriorityLyricsFetch(
      {
        track: candidate,
        artist,
        album,
        duration: numDuration,
        trackId: rawTrackId,
        preferKaraoke: isKaraokePreferred,
      },
      {
        sourcesPriority,
        karaokeSourcesPriority,
        disabledSources,
        preferKaraoke: isKaraokePreferred,
      }
    );

    if (result) {
      matchedCandidate = candidate;
      isFallbackToBase = i > 0 && candidate === analysis.baseTrack;
      break;
    }
  }

  if (result) {
    const payload = {
      song: track,
      matchedCandidate,
      isFallbackToBase,
      variantDetected: analysis.hasVariant ? analysis.variantTag || true : false,
      lyrics: result.lyrics,
      synced: result.synced,
      isWordSynced: !!result.isWordSynced,
      source: result.source,
      cached: false,
    };

    // Store in persistent cache (14 days TTL)
    await setPersistentCache("lyrics", primaryKey, payload);
    if (artist) await setPersistentCache("lyrics", secondaryKey, payload);

    return res.status(200).json(payload);
  }

  return res.status(404).json({
    song: track,
    baseTrack: analysis.baseTrack,
    error: "No lyrics found across configured sources",
  });
}
