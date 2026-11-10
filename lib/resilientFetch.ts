/**
 * Resilient Fetch Utility for Lirics
 * 
 * Provides:
 * - Safe, increased timeouts (default 8000ms instead of aggressive 1800ms)
 * - Clean error trapping (no unhandled DOMException or TimeoutError stack dumps in Next.js logs)
 * - Optional lightweight retry with exponential/linear backoff
 * - Structured return object with status, duration, and error codes
 */

export interface ResilientFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  silent?: boolean;
}

export interface ResilientFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText?: string;
  error?: string;
  isTimeout: boolean;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 8000;

export async function resilientFetchJson<T = any>(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<ResilientFetchResult<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 1,
    retryDelayMs = 400,
    silent = true,
    ...fetchInit
  } = options;

  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          data: null,
          error: `HTTP ${response.status} ${response.statusText}`,
          isTimeout: false,
          durationMs,
        };
      }

      const data = (await response.json()) as T;
      return {
        ok: true,
        status: response.status,
        data,
        isTimeout: false,
        durationMs,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isAbortOrTimeout =
        err?.name === "AbortError" ||
        err?.name === "TimeoutError" ||
        err?.message?.includes("aborted") ||
        err?.message?.includes("timeout");

      const isLastAttempt = attempt > retries;

      if (!isLastAttempt) {
        // Wait briefly before retrying
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        continue;
      }

      const durationMs = Date.now() - startTime;

      if (!silent) {
        console.warn(
          `[ResilientFetch] ${isAbortOrTimeout ? "Timeout" : "Fetch error"} on ${url} (${durationMs}ms): ${err?.message || err}`
        );
      }

      return {
        ok: false,
        status: isAbortOrTimeout ? 408 : 500,
        data: null,
        error: isAbortOrTimeout ? "REQUEST_TIMEOUT" : (err?.message || "FETCH_FAILED"),
        isTimeout: isAbortOrTimeout,
        durationMs,
      };
    }
  }

  return {
    ok: false,
    status: 500,
    data: null,
    error: "UNKNOWN_FETCH_ERROR",
    isTimeout: false,
    durationMs: Date.now() - startTime,
  };
}
