import React, { useState } from "react";
import { FolderPlus, Download, Play, Music, CheckCircle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";

interface Playlist {
  id: string;
  name: string;
  tracks: TrackItem[];
}

const initialPlaylists: Playlist[] = [
  {
    id: "p1",
    name: "Favorites",
    tracks: [
      { id: "fav1", title: "Bad At Love", artist: "Halsey", source: "youtube" },
      { id: "fav2", title: "Passionfruit", artist: "Drake", source: "youtube" },
      { id: "fav3", title: "Resonance", artist: "HOME", source: "youtube" },
    ],
  },
];

export const LibraryView: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(initialPlaylists[0]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>("");
  const { playTrack } = usePlayer();
  const { setQueue } = useQueue();

  const handleImportLocalFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: "Audio Files", extensions: ["mp3", "flac", "wav", "m4a", "ogg", "webm"] }],
      });

      if (selected && Array.isArray(selected) && selected.length > 0) {
        const newTracks: TrackItem[] = selected.map((filePath: string, idx: number) => {
          const fileName = filePath.split("/").pop() || filePath;
          const cleanName = fileName.replace(/\.[^/.]+$/, "");
          let title = cleanName;
          let artist = "Local File";
          if (cleanName.includes(" - ")) {
            const parts = cleanName.split(" - ");
            artist = parts[0].trim();
            title = parts.slice(1).join(" - ").trim();
          }

          return {
            id: `local-${Date.now()}-${idx}`,
            title,
            artist,
            source: "local",
            localPath: filePath,
          };
        });

        const updated = {
          ...selectedPlaylist,
          tracks: [...selectedPlaylist.tracks, ...newTracks],
        };
        setSelectedPlaylist(updated);
        setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch (e) {
      console.warn("File import error:", e);
    }
  };

  const handleDownloadPlaylist = async () => {
    if (selectedPlaylist.tracks.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress("Starting download...");

    let done = 0;
    for (const track of selectedPlaylist.tracks) {
      if (track.source === "youtube") {
        setDownloadProgress(`Downloading ${track.title}... (${done + 1}/${selectedPlaylist.tracks.length})`);
        try {
          await fetch(
            `http://127.0.0.1:8000/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(
              track.artist
            )}`
          );
        } catch (err) {
          console.warn(`Failed to pre-download ${track.title}:`, err);
        }
      }
      done++;
    }

    setDownloadProgress("All tracks downloaded!");
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress("");
    }, 2500);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setQueue(playlist.tracks, 0);
      playTrack(playlist.tracks[0]);
    }
  };

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>
            Library
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #9ca3af)", fontSize: 14 }}>
            Manage playlists, local audio files, and offline downloads
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleImportLocalFiles}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-surface, #1a1f26)",
              border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
              color: "var(--text-primary, #ffffff)",
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FolderPlus size={16} />
            <span>Import Local Files</span>
          </button>

          <button
            onClick={handleDownloadPlaylist}
            disabled={isDownloading || selectedPlaylist.tracks.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--accent-primary, #e11d48)",
              border: "none",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: isDownloading ? "not-allowed" : "pointer",
            }}
          >
            {isDownloading ? <CheckCircle size={16} /> : <Download size={16} />}
            <span>{isDownloading ? downloadProgress : "Download Playlist"}</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* Playlists column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted, #6b7280)", margin: "0 0 8px 4px" }}>
            PLAYLISTS
          </h3>
          {playlists.map((p) => {
            const isSel = p.id === selectedPlaylist.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlaylist(p)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isSel ? "var(--bg-surface-hover, rgba(255,255,255,0.1))" : "var(--card-bg, #141820)",
                  border: isSel
                    ? "1px solid var(--accent-primary, #e11d48)"
                    : "1px solid var(--border-color, rgba(255,255,255,0.06))",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)", marginTop: 2 }}>
                    {p.tracks.length} tracks
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPlaylist(p);
                  }}
                  title="Play Playlist"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-primary, #e11d48)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <Play size={18} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tracks in Playlist */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary, #ffffff)", margin: 0 }}>
              {selectedPlaylist.name} ({selectedPlaylist.tracks.length})
            </h3>
            <button
              onClick={() => handlePlayPlaylist(selectedPlaylist)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--accent-primary, #e11d48)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Play size={16} fill="#ffffff" />
              <span>Play All</span>
            </button>
          </div>

          {selectedPlaylist.tracks.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                background: "var(--card-bg, #141820)",
                borderRadius: 12,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              <Music size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <div>This playlist is empty. Import local files or add from Search!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedPlaylist.tracks.map((t, idx) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    borderRadius: 8,
                    background: "var(--card-bg, #141820)",
                    border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted, #6b7280)", width: 20 }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)" }}>
                        {t.artist} • <span style={{ textTransform: "uppercase", fontSize: 10 }}>{t.source}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => playTrack(t)}
                    title="Play track"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-primary, #e11d48)",
                      cursor: "pointer",
                      padding: 6,
                    }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
