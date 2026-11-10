import { LyricSourceId } from "../lyricsSources";

export interface LyricLine {
  seconds: number;
  lyrics: string;
}

export interface LyricProviderResult {
  lyrics: LyricLine[] | string;
  synced: boolean;
  isWordSynced?: boolean;
  source: LyricSourceId;
}

export interface LyricFetchParams {
  track: string;
  artist?: string;
  album?: string;
  duration?: number;
  trackId?: string;
  preferKaraoke?: boolean;
  signal?: AbortSignal;
}

export interface LyricProvider {
  id: LyricSourceId;
  name: string;
  supportsKaraoke: boolean;
  fetch(params: LyricFetchParams): Promise<LyricProviderResult | null>;
}
