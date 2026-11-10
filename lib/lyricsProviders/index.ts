import { LyricSourceId, DEFAULT_LYRIC_SOURCES_PRIORITY, DEFAULT_KARAOKE_SOURCES_PRIORITY } from "../lyricsSources";
import { LyricProvider, LyricFetchParams, LyricProviderResult } from "./types";
import { lrclibProvider } from "./lrclib";
import { neteaseProvider } from "./netease";
import { spotifyProvider } from "./spotify";
import { kugouProvider } from "./kugou";
import { musixmatchProvider } from "./musixmatch";
import { geniusProvider } from "./genius";

const PROVIDER_REGISTRY: Record<LyricSourceId, LyricProvider> = {
  lrclib: lrclibProvider,
  netease: neteaseProvider,
  spotify: spotifyProvider,
  kugou: kugouProvider,
  musixmatch: musixmatchProvider,
  genius: geniusProvider,
};

/**
 * Executes a prioritized multi-source fetch.
 * Iterates through the given priority order, skipping disabled providers,
 * until a provider succeeds in returning lyrics.
 */
export async function executePriorityLyricsFetch(
  params: LyricFetchParams,
  options?: {
    sourcesPriority?: LyricSourceId[];
    karaokeSourcesPriority?: LyricSourceId[];
    disabledSources?: LyricSourceId[];
    preferKaraoke?: boolean;
  }
): Promise<LyricProviderResult | null> {
  const disabledSet = new Set<LyricSourceId>(options?.disabledSources || []);
  const preferKaraoke = !!options?.preferKaraoke;

  // Determine active priority chain
  let activeChain: LyricSourceId[] = preferKaraoke
    ? options?.karaokeSourcesPriority || DEFAULT_KARAOKE_SOURCES_PRIORITY
    : options?.sourcesPriority || DEFAULT_LYRIC_SOURCES_PRIORITY;

  // If user provided a custom list, ensure any omitted active sources are appended as fallbacks
  const chainSet = new Set<LyricSourceId>(activeChain);
  for (const fallback of DEFAULT_LYRIC_SOURCES_PRIORITY) {
    if (!chainSet.has(fallback)) {
      activeChain.push(fallback);
    }
  }

  // Filter out explicitly disabled sources
  const eligibleProviders = activeChain
    .filter((id) => !disabledSet.has(id))
    .map((id) => PROVIDER_REGISTRY[id])
    .filter(Boolean);

  // Execute priority waterfall with a strict 2500ms timeout per provider
  for (const provider of eligibleProviders) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, 2500);

    try {
      const fetchPromise = provider.fetch({
        ...params,
        signal: controller.signal,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(`[Lyrics] Provider '${provider.id}' aborted: exceeded strict 2500ms timeout`));
        });
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutTimer);

      if (result) {
        // If lyrics is array and non-empty, or non-empty plain string
        if (Array.isArray(result.lyrics) && result.lyrics.length > 0) {
          return result;
        } else if (typeof result.lyrics === "string" && result.lyrics.trim().length > 0) {
          return result;
        }
      }
    } catch {
      // Provider timed out (>3000ms) or encountered network error. Continue immediately to next provider.
      controller.abort();
    } finally {
      clearTimeout(timeoutTimer);
    }
  }

  return null;
}

export * from "./types";
