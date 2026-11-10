/**
 * Shared Rate-Limit Coordinator for Spotify Cloud Web API.
 * Ensures that if a 429 QUOTA_EXCEEDED is received from Spotify,
 * all endpoints (pos, liked, queue, playback) immediately silence their cloud requests
 * for a full cooldown period (default 90-120s) so Spotify's API quota can recover,
 * while automatically falling back to the 0ms local Windows SMTC bridge.
 */

let rateLimitUntil = 0;

export function isSpotifyRateLimited(): boolean {
  return Date.now() < rateLimitUntil;
}

export function getRemainingRateLimitSeconds(): number {
  return Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
}

export function triggerSpotifyRateLimit(retryAfterSeconds = 90) {
  const cooldown = Math.max(60, retryAfterSeconds);
  rateLimitUntil = Date.now() + cooldown * 1000;
  console.warn(
    `[RateLimitCoordinator] Spotify Web API 429 QUOTA_EXCEEDED. Silencing all cloud calls for ${cooldown}s. Using Windows SMTC local bridge.`
  );
}

export function clearSpotifyRateLimit() {
  rateLimitUntil = 0;
}
