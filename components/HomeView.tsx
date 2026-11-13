/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { Play, Music, Radio, Disc, User, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";
import { getContrastTextColor } from "@/lib/contrastUtils";

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
}

interface YtMixItem {
  title: string;
  playlistId?: string;
  videoId?: string;
  thumbnails?: { url: string }[];
  description?: string;
  artists?: { name: string }[];
}

interface YtSection {
  title: string;
  contents: YtMixItem[];
}

const ImageWithFallback: React.FC<{
  src?: string;
  alt: string;
  fallbackText: string;
  style?: React.CSSProperties;
}> = ({ src, alt, fallbackText, style }) => {
  const [error, setError] = useState(!src);

  if (error || !src) {
    const char = fallbackText.trim().charAt(0).toUpperCase() || "🎵";
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e293b, #334155)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 22,
          userSelect: "none",
          ...style,
        }}
      >
        {char}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      style={{ objectFit: "cover", ...style }}
    />
  );
};

const SkeletonCard: React.FC = () => (
  <div
    style={{
      minWidth: 170,
      width: 170,
      height: 230,
      borderRadius: 14,
      background: "rgba(20, 20, 25, 0.5)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      opacity: 0.6,
      animation: "pulse 1.8s infinite ease-in-out",
    }}
  >
    <div style={{ width: "100%", height: 140, borderRadius: 10, background: "rgba(255,255,255,0.08)" }} />
    <div style={{ width: "80%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
    <div style={{ width: "50%", height: 12, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
  </div>
);

export const HomeView: React.FC = () => {
  const { data: session } = useSession();
  const { playTrack } = usePlayer();
  const { addToQueue } = useQueue();

  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [spotifyArtists, setSpotifyArtists] = useState<SpotifyArtist[]>([]);
  const [ytSections, setYtSections] = useState<YtSection[]>([]);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [loadingYt, setLoadingYt] = useState(true);

  // 1. Fetch real Spotify Playlists & Top Artists using token
  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    setLoadingSpotify(true);

    // Fetch user playlists: https://api.spotify.com/v1/me/playlists
    fetch("https://api.spotify.com/v1/me/playlists?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setSpotifyPlaylists(data.items);
        }
      })
      .catch((e) => console.warn("Spotify playlists fetch failed:", e));

    // Fetch user top artists: https://api.spotify.com/v1/me/top/artists
    fetch("https://api.spotify.com/v1/me/top/artists?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setSpotifyArtists(data.items);
        }
      })
      .catch((e) => console.warn("Spotify top artists fetch failed:", e))
      .finally(() => setLoadingSpotify(false));
  }, [session]);

  // 2. Fetch real YouTube Music Home sections from python backend
  useEffect(() => {
    setLoadingYt(true);
    fetch("http://127.0.0.1:8000/yt_home")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.sections)) {
          setYtSections(data.sections);
        }
      })
      .catch((e) => console.warn("YouTube Home fetch failed:", e))
      .finally(() => setLoadingYt(false));
  }, []);

  const handlePlayYtItem = (item: YtMixItem) => {
    const track: TrackItem = {
      id: item.videoId || `yt-${Date.now()}`,
      title: item.title,
      artist: item.artists?.[0]?.name || item.description || "YouTube Music",
      coverArt: item.thumbnails?.[0]?.url,
      source: "youtube",
    };
    playTrack(track);
  };

  const handlePlaySpotifyPlaylist = (pl: SpotifyPlaylist) => {
    const track: TrackItem = {
      id: pl.id,
      title: pl.name,
      artist: `Playlist • ${pl.tracks.total} songs`,
      coverArt: pl.images?.[0]?.url,
      source: "spotify",
    };
    playTrack(track);
  };

  return (
    <div
      style={{
        padding: "32px 40px 100px",
        overflowY: "auto",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Welcome Banner */}
      <div
        style={{
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(225, 29, 72, 0.3) 0%, rgba(79, 70, 229, 0.25) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(24px)",
          padding: "32px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.5px" }}>
            Welcome to Nocturne
          </h1>
          <p style={{ margin: "8px 0 0", color: "#cbd5e1", fontSize: 14 }}>
            Native hybrid music hub powered by YouTube raw audio, local files, and Spotify bridge.
          </p>
        </div>
      </div>

      {/* Real YouTube Music Feed Sections */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Radio size={20} color="var(--accent-primary, #e11d48)" />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#ffffff" }}>
            YouTube Music Feeds
          </h2>
        </div>

        {loadingYt ? (
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : ytSections.length === 0 ? (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              background: "rgba(20, 20, 25, 0.7)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No YouTube Music mixes found. Ensure the Python server is running on port 8000.
          </div>
        ) : (
          ytSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 14px" }}>
                {sec.title}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  overflowX: "auto",
                  paddingBottom: 8,
                }}
              >
                {sec.contents?.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={() => handlePlayYtItem(item)}
                    style={{
                      minWidth: 170,
                      width: 170,
                      background: "rgba(20, 20, 25, 0.7)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 14,
                      padding: 12,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.borderColor = "var(--accent-primary, #e11d48)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: 146, borderRadius: 10, overflow: "hidden" }}>
                      <ImageWithFallback
                        src={item.thumbnails?.[item.thumbnails.length - 1]?.url}
                        alt={item.title}
                        fallbackText={item.title}
                        style={{ width: "100%", height: "100%" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--accent-primary, #e11d48)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                        }}
                      >
                        <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.artists?.[0]?.name || item.description || "YouTube Music"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Spotify Saved Playlists Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Music size={20} color="#1ed760" />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#ffffff" }}>
            Your Spotify Playlists
          </h2>
        </div>

        {loadingSpotify ? (
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : spotifyPlaylists.length === 0 ? (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              background: "rgba(20, 20, 25, 0.7)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No Spotify playlists found. Sign in via Settings &gt; Integrations to sync your library.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
            {spotifyPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => handlePlaySpotifyPlaylist(pl)}
                style={{
                  minWidth: 170,
                  width: 170,
                  background: "rgba(20, 20, 25, 0.7)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 14,
                  padding: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.borderColor = "#1ed760";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div style={{ width: "100%", height: 146, borderRadius: 10, overflow: "hidden", position: "relative" }}>
                  <ImageWithFallback
                    src={pl.images?.[0]?.url}
                    alt={pl.name}
                    fallbackText={pl.name}
                    style={{ width: "100%", height: "100%" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#1ed760",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                  >
                    <Play size={16} fill="#000000" color="#000000" style={{ marginLeft: 2 }} />
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {pl.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                    {pl.tracks.total} songs
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spotify Top Artists Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <User size={20} color="#38bdf8" />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#ffffff" }}>
            Top Artists
          </h2>
        </div>

        {spotifyArtists.length === 0 && !loadingSpotify ? (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              background: "rgba(20, 20, 25, 0.7)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No top artists recorded. Connect your Spotify account in Settings.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 10 }}>
            {spotifyArtists.map((artist) => (
              <div
                key={artist.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 120,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.15)",
                    marginBottom: 8,
                  }}
                >
                  <ImageWithFallback
                    src={artist.images?.[0]?.url}
                    alt={artist.name}
                    fallbackText={artist.name}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#ffffff",
                    textAlign: "center",
                    maxWidth: 110,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {artist.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    textAlign: "center",
                    maxWidth: 110,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {artist.genres?.[0] || "Artist"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
