import React from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

interface PlayerBarProps {
  onOpenNowPlaying: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onOpenNowPlaying }) => {
  const { currentTrack, isPlaying, progress, duration, volume, isResolving, togglePlay, seek, setVolume, playNextTrack, playPrevTrack } =
    usePlayer();

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <footer
      style={{
        height: 76,
        padding: "0 20px",
        background: "var(--player-bg, #0f1217)",
        borderTop: "1px solid var(--border-color, rgba(255,255,255,0.08))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
        zIndex: 20,
      }}
    >
      {/* Left: Track Information & Album Art thumbnail */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240, width: "25%" }}>
        <div
          onClick={onOpenNowPlaying}
          title="Open Now Playing & Lyrics (Click)"
          style={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: "hidden",
            cursor: "pointer",
            background: "var(--bg-surface, #1a1f26)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            flexShrink: 0,
          }}
        >
          {currentTrack?.coverArt ? (
            <img
              src={currentTrack.coverArt}
              alt="Art"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                background: "linear-gradient(135deg, var(--accent-primary, #e11d48), #3b82f6)",
              }}
            >
              🎵
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              opacity: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <Maximize2 size={18} color="#ffffff" />
          </div>
        </div>

        <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            onClick={onOpenNowPlaying}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary, #ffffff)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "pointer",
            }}
          >
            {currentTrack?.title || "No track playing"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary, #9ca3af)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentTrack?.artist || "Choose a song to start"}
          </div>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          flex: 1,
          maxWidth: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <button
            onClick={playPrevTrack}
            disabled={!currentTrack}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #9ca3af)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentTrack || isResolving}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent-primary, #e11d48)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(225, 29, 72, 0.4)",
              transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isResolving ? (
              <span style={{ fontSize: 10 }}>...</span>
            ) : isPlaying ? (
              <Pause size={18} fill="#ffffff" />
            ) : (
              <Play size={18} fill="#ffffff" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            onClick={playNextTrack}
            disabled={!currentTrack}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #9ca3af)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted, #6b7280)", minWidth: 32, textAlign: "right" }}>
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={progress}
            onChange={handleSeekChange}
            style={{
              flex: 1,
              height: 4,
              accentColor: "var(--accent-primary, #e11d48)",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted, #6b7280)", minWidth: 32 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Expand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, minWidth: 200, width: "25%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Volume2 size={16} color="var(--text-secondary, #9ca3af)" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: 80,
              height: 4,
              accentColor: "var(--accent-primary, #e11d48)",
              cursor: "pointer",
            }}
          />
        </div>

        <button
          onClick={onOpenNowPlaying}
          title="Expand Lyrics & Visualizer"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary, #9ca3af)",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary, #ffffff)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")}
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </footer>
  );
};
