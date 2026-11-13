/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
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
          fontSize: 18,
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

export const PlayerBar: React.FC<PlayerBarProps> = ({ onOpenNowPlaying }) => {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isResolving,
    togglePlay,
    seek,
    setVolume,
    playNextTrack,
    playPrevTrack,
  } = usePlayer();

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <footer
      style={{
        height: 78,
        padding: "0 24px",
        background: "rgba(20, 20, 25, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
        zIndex: 40,
        position: "relative",
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
            background: "rgba(255, 255, 255, 0.05)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            flexShrink: 0,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <ImageWithFallback
            src={currentTrack?.coverArt}
            alt={currentTrack?.title || "Track art"}
            fallbackText={currentTrack?.title || "Music"}
            style={{ width: "100%", height: "100%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              opacity: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity 0.2s ease",
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
              color: "#ffffff",
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
              color: "#94a3b8",
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
              color: currentTrack ? "#cbd5e1" : "#475569",
              cursor: currentTrack ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentTrack || isResolving}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--accent-primary, #e11d48)",
              border: "none",
              color: "#ffffff",
              cursor: currentTrack ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1)";
            }}
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
              color: currentTrack ? "#cbd5e1" : "#475569",
              cursor: currentTrack ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              if (currentTrack) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 34, textAlign: "right" }}>
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
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 34 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Expand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          minWidth: 200,
          width: "25%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Volume2 size={16} color="#94a3b8" />
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
            color: "#94a3b8",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </footer>
  );
};
