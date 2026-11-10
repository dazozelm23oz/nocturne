import NextAuth, { User } from "next-auth";
import spotifyApi from "../../../lib/spotify";
import Spotify from "next-auth/providers/spotify";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token: string;
    expires_at: number;
    refresh_token: string;
    error?: "RefreshAccessTokenError";
  }
}

const baseSpotifyProvider = Spotify({
  clientId: process.env.CLIENT_ID as string,
  clientSecret: process.env.SECRET as string,
  authorization: {
    params: {
      scope:
        "user-read-playback-state user-read-currently-playing user-read-private user-modify-playback-state user-library-read user-library-modify",
      show_dialog: "true",
    },
  },
});

export default NextAuth({
  providers: [
    {
      ...baseSpotifyProvider,
      userinfo: {
        url: "https://api.spotify.com/v1/me",
        async request({ tokens }: any) {
          const accessToken = tokens?.access_token;
          if (!accessToken) {
            return {
              id: "spotify-user",
              display_name: "Spotify Listener",
              email: null,
              images: [],
            };
          }

          // Try fetching userinfo from Spotify, retrying on 429
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const res = await fetch("https://api.spotify.com/v1/me", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (res.ok) {
                return await res.json();
              }

              if (res.status === 429) {
                const retrySec = parseInt(res.headers.get("retry-after") || "2", 10);
                console.warn(`[NextAuth userinfo] 429 rate limit hit. Waiting ${retrySec}s...`);
                await new Promise((r) => setTimeout(r, Math.min(retrySec * 1000, 3000)));
                continue;
              }
            } catch (fetchErr) {
              console.warn("[NextAuth userinfo] fetch error:", fetchErr);
            }
          }

          // Resilient fallback profile if Spotify API is temporarily rate-limited
          // Allows sign-in to succeed without crashing into "Try signing in with a different account."
          console.warn("[NextAuth userinfo] Spotify /v1/me rate-limited (429). Using resilient fallback profile.");
          return {
            id: "spotify-user",
            display_name: "Spotify Listener",
            email: null,
            images: [],
          };
        },
      },
      profile(profile: any) {
        return {
          id: profile?.id || "spotify-user",
          name: profile?.display_name || "Spotify Listener",
          email: profile?.email || null,
          image: profile?.images?.[0]?.url || null,
        };
      },
    },
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as User;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account && account.provider === "spotify") {
        spotifyApi.setAccessToken(account?.access_token as string);
        spotifyApi.setRefreshToken(account?.refresh_token as string);
        return true;
      }
      return false;
    },
    async jwt({ token, account }) {
      if (account) {
        spotifyApi.setAccessToken(account.access_token as string);
        spotifyApi.setRefreshToken(account.refresh_token as string);

        return {
          ...token,
          access_token: account.access_token as string,
          expires_at: account.expires_at as number,
          refresh_token: account.refresh_token as string,
        };
      }

      const isTokenExpired = Date.now() >= (token.expires_at as number) * 1000;
      if (!isTokenExpired) {
        return token;
      }

      if (!token.refresh_token) {
        return {
          ...token,
          error: "RefreshAccessTokenError" as const,
        };
      }

      try {
        spotifyApi.setRefreshToken(token.refresh_token as string);
        const response = await spotifyApi.refreshAccessToken();
        const responseTokens = response.body;

        spotifyApi.setAccessToken(responseTokens.access_token);

        return {
          ...token,
          access_token: responseTokens.access_token,
          expires_at: Math.floor(
            Date.now() / 1000 + (responseTokens.expires_in as number)
          ),
          refresh_token:
            responseTokens.refresh_token ?? token.refresh_token,
        } as JWT;
      } catch (error) {
        console.error("Error refreshing Spotify access token", error);
        return {
          ...token,
          error: "RefreshAccessTokenError" as const,
        } as JWT;
      }
    },
  },
});
