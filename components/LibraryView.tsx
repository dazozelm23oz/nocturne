/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { FolderPlus, Download, Play, Music, Trash2, Folder, CheckCircle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";
import { useSession } from "next-auth/react";

interface Playlist {
  id: string;
  name: string;
  tracks: TrackItem[];
  coverArt?: string;
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
          fontSize: 20,
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

export const LibraryView: React.FC = () => {
  const { data: session } = useSession();
  const { playTrack } = usePlayer();
  const { setQueue } = useQueue();

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nocturne_local_playlists");
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to load local playlists:", e);
      }
    }
    return [
      {
        id: "local-lib",
        name: "Local Library",
        tracks: [],
      },
    ];
  });

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("local-lib");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync playlists to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nocturne_local_playlists", JSON.stringify(playlists));
      } catch (e) {
        console.warn("Failed to persist local playlists:", e);
      }
    }
  }, [playlists]);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  // Import local files using Tauri plugin dialog
  const handleImportLocalFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Audio Files",
            extensions: ["mp3", "flac", "m4a", "wav", "ogg", "opus", "webm", "aac"],
          },
        ],
        title: "Import Audio Files to Local Library",
      });

      if (!selected) return;

      const filePaths: string[] = Array.isArray(selected) ? selected : [selected];
      if (filePaths.length === 0) return;

      const newTracks: TrackItem[] = filePaths.map((filePath, idx) => {
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "Audio Track";
        const cleanName = fileName.replace(/\.[^/.]+$/, "");
        let artist = "Local File";
        let title = cleanName;

        if (cleanName.includes(" - ")) {
          const parts = cleanName.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        return {
          id: `local-${Date.now()}-${idx}`,
          title,
          artist,
          localPath: filePath,
          source: "local",
        };
      });

      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === "local-lib") {
            return {
              ...p,
              tracks: [...p.tracks, ...newTracks],
            };
          }
          return p;
        })
      );

      setStatusMessage(`Imported ${newTracks.length} local audio track(s)!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      console.warn("Failed to import local files:", e);
      setStatusMessage(`Import failed: ${e?.message || e}`);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handlePlayActivePlaylist = () => {
    if (activePlaylist && activePlaylist.tracks.length > 0) {
      setQueue(activePlaylist.tracks, 0);
      playTrack(activePlaylist.tracks[0]);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === activePlaylist.id) {
          return {
            ...p,
            tracks: p.tracks.filter((t) => t.id !== trackId),
          };
        }
        return p;
      })
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg-primary, #0d0f12)",
      }}
    >
      {/* Left Playlists Sidebar */}
      <div
        style={{
          width: 250,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(14, 16, 21, 0.7)",
          backdropFilter: "blur(24px)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff" }}>Playlists</h2>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{playlists.length} collections</span>
        </div>

        <button
          onClick={handleImportLocalFiles}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--accent-primary, #e11d48)",
            border: "none",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <FolderPlus size={16} /> Import Local Files
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
          {playlists.map((pl) => {
            const isSelected = pl.id === selectedPlaylistId;
            return (
              <button
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: "pointer",
                  background: isSelected ? "rgba(255,255,255,0.12)" : "transparent",
                  color: isSelected ? "#ffffff" : "#94a3b8",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <Music size={16} color={isSelected ? "var(--accent-primary, #e11d48)" : "#64748b"} />
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {pl.name}
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{pl.tracks.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content Area: Track list of selected playlist */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "36px 44px 100px",
          boxSizing: "border-box",
        }}
      >
        {statusMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#ffffff",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} color="#10b981" />
            {statusMessage}
          </div>
        )}

        {/* Header of Active Playlist */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              flexShrink: 0,
            }}
          >
            <ImageWithFallback
              src={activePlaylist?.coverArt}
              alt={activePlaylist?.name || "Playlist"}
              fallbackText={activePlaylist?.name || "Library"}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-primary, #e11d48)", textTransform: "uppercase" }}>
              Collection
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "4px 0 8px", color: "#ffffff" }}>
              {activePlaylist?.name}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              {activePlaylist?.tracks.length || 0} track(s) ready for gapless playback
            </p>
            {activePlaylist && activePlaylist.tracks.length > 0 && (
              <button
                onClick={handlePlayActivePlaylist}
                style={{
                  marginTop: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: 10,
                  background: "var(--accent-primary, #e11d48)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Play size={16} fill="#ffffff" color="#ffffff" /> Play All
              </button>
            )}
          </div>
        </div>

        {/* Tracks List or Empty State */}
        {activePlaylist.tracks.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "rgba(20, 20, 25, 0.7)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
            }}
          >
            <Folder size={44} color="#64748b" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ margin: "0 0 8px", color: "#ffffff", fontSize: 18 }}>No tracks found in this collection</h3>
            <p style={{ margin: "0 0 20px", color: "#94a3b8", fontSize: 13, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
              Click &quot;Import Local Files&quot; to load your downloaded audio files, or queue songs from Search and YouTube feeds.
            </p>
            <button
              onClick={handleImportLocalFiles}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FolderPlus size={16} /> Choose Audio Files
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(20, 20, 25, 0.7)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {activePlaylist.tracks.map((track, idx) => (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  borderBottom:
                    idx < activePlaylist.tracks.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  onClick={() => playTrack(track)}
                  style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}
                >
                  <span style={{ fontSize: 13, color: "#64748b", width: 24, textAlign: "right" }}>
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {track.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                    }}
                  >
                    {track.source}
                  </span>
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    title="Remove from playlist"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 6,
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
