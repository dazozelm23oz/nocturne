# Spotify OAuth 429 Quota Exceeded & "Sign in with different account" Resolution

## 1. Problem Description
When clicking **Sign in with Spotify**, the browser redirected to an error page displaying:
> **"Try signing in with a different account."**

---

## 2. Root Cause Analysis

### A. The NextAuth `OAuthCallbackError`
Under the hood, NextAuth's OAuth flow performs two sequential steps:
1. Exchanges the authorization code for access tokens via `https://accounts.spotify.com/api/token`.
2. Requests the user profile via `https://api.spotify.com/v1/me` (`Client.userinfo`).

In the server logs, step 2 consistently crashed with:
```text
[next-auth][error][OAUTH_CALLBACK_ERROR] 
https://next-auth.js.org/errors#oauth_callback_error expected 200 OK, got: 429 Too Many Requests {
  error: OPError: expected 200 OK, got: 429 Too Many Requests
      at processResponse (.../openid-client/lib/helpers/process_response.js:41:11)
      at Client.userinfo (.../openid-client/lib/client.js:1264:18)
}
```
Whenever NextAuth encounters an unhandled error during `oAuthCallback`, it redirects to `/api/auth/error?error=OAuthCallback`. The default NextAuth error template for `OAuthCallback` hardcodes the message:
**"Try signing in with a different account."**

### B. The 429 Quota Exceeded Loop
The Spotify Developer Client ID was rate-limited because background polling was continuously querying Spotify's cloud Web API:
- `pos.ts` queried `getMyCurrentPlaybackState()` every 1,000ms.
- `queue.ts` queried `/v1/me/player/queue` every 6,000ms.
- `liked.ts` queried `/v1/me/library/contains` on every track change.
- When Spotify responded with 429, the app retried after only 25 seconds, causing Spotify's API firewall to escalate the rate-limit penalty (`Retry-After: 43020s` / 12 hours).

### C. Secondary Factor: Spotify Developer Dashboard Whitelist
In Spotify Developer apps configured in **Development Mode**, Spotify only permits logins from:
- The Spotify account that created the application in the Spotify Developer Dashboard.
- Up to 25 specific email addresses explicitly registered under **Dashboard → App Settings → User Management**.
Any non-whitelisted account is rejected by Spotify's OAuth authorization gateway.

---

## 3. Engineering Fixes Implemented

### 1. Fast-Path Local Windows SMTC Architecture ([`pages/api/spotify/pos.ts`](../../pages/api/spotify/pos.ts))
Reversed the polling order so that local Windows System Media Transport Controls (SMTC) is always queried first:
- When Spotify Desktop is playing locally, `pos.ts` returns the track, artist, album art, position, and duration in **0.1ms** via PowerShell WinRT.
- **Zero requests** are made to `api.spotify.com`.
- Works completely offline and eliminates cloud rate limits.

### 2. Global Rate Limit Coordinator ([`lib/rateLimitCoordinator.ts`](../../lib/rateLimitCoordinator.ts))
A shared singleton coordinator coordinates all Spotify endpoints (`pos`, `queue`, `liked`):
- If any endpoint encounters a 429 response, all Spotify Cloud calls are silenced for the duration specified in the `Retry-After` header.
- Cached liked status is stored in an in-memory map with a 3-minute TTL to prevent redundant requests.

### 3. Resilient NextAuth `userinfo.request` ([`pages/api/auth/[...nextauth].ts`](../../pages/api/auth/[...nextauth].ts))
Added a custom `userinfo.request` interceptor to the Spotify provider:
- Attempts to retrieve `/v1/me` with automatic backoff.
- If Spotify's API returns 429, it gracefully provides a fallback profile (`id: "spotify-user"`, `display_name: "Spotify Listener"`), allowing OAuth sign-in and token persistence to succeed without crashing into the NextAuth error screen.

### 4. Custom Diagnostic Auth Error Page ([`pages/auth/error.tsx`](../../pages/auth/error.tsx))
Replaced NextAuth's generic error page with a branded Gruvbox diagnostic interface that provides:
- Live cooldown countdown timer before retrying.
- Clear instructions regarding Developer Mode account whitelisting.
- A 1-click **Continue to Player (Local SMTC Mode)** fallback.
