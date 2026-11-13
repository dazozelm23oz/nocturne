/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
} from "lucide-react";
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
          fontSize: 16,
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

  const [isLiked, setIsLiked] = useState(false);
  const [volumeHover, setVolumeHover] = useState(false);

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div
      style={{
        position: "relative",
        height: 64,
        width: "100%",
        userSelect: "none",
        zIndex: 55,
        flexShrink: 0,
      }}
    >
      {/* Liner 1:1 Floating Glass Island Card */}
      <div
        style={{
          position: "relative",
          height: 64,
          width: "100%",
          overflow: "hidden",
          borderRadius: 12,
          background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
          backdropFilter: "blur(48px) saturate(150%)",
          WebkitBackdropFilter: "blur(48px) saturate(150%)",
          border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr) 260px",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Liner Signature Background Progress Tick Fill */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--fill-hover, rgba(255, 255, 255, 0.06))",
            transformOrigin: "left",
            transform: `scaleX(${progressRatio})`,
            transition: isPlaying
              ? "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Column 1: Track Information (Left 280px) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 18px",
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* 38x38 Thumbnail with 8px radius */}
          <div
            onClick={onOpenNowPlaying}
            title="Expand Fullscreen Player (Click)"
            style={{
              position: "relative",
              width: 38,
              height: 38,
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "var(--bg-elevated, #141414)",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ImageWithFallback
              src={currentTrack?.coverArt}
              alt={currentTrack?.title || "Album Art"}
              fallbackText={currentTrack?.title || "Music"}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Title & Artist */}
          <div style={{ minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              onClick={onOpenNowPlaying}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-primary, #ffffff)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              {currentTrack?.title || "No track playing"}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "var(--text-tertiary, rgba(255, 255, 255, 0.45))",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentTrack?.artist || "Choose a song to begin"}
            </span>
          </div>

          {/* Like Heart Button */}
          {currentTrack && (
            <button
              onClick={() => setIsLiked(!isLiked)}
              aria-label={isLiked ? "Unlike" : "Like"}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: isLiked ? "var(--accent-primary, #ff4d4d)" : "var(--text-tertiary, rgba(255,255,255,0.45))",
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s ease",
                marginLeft: "auto",
                flexShrink: 0,
              }}
            >
              <Heart size={16} fill={isLiked ? "var(--accent-primary, #ff4d4d)" : "none"} />
            </button>
          )}
        </div>

        {/* Column 2: Center Controls & Scrubber */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "0 12px",
            position: "relative",
            zIndex: 1,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Playback Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={playPrevTrack}
              disabled={!currentTrack}
              style={{
                background: "transparent",
                border: "none",
                color: currentTrack ? "var(--text-secondary, rgba(255, 255, 255, 0.7))" : "rgba(255,255,255,0.2)",
                cursor: currentTrack ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                padding: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (currentTrack) e.currentTarget.style.color = "var(--text-primary, #ffffff)";
              }}
              onMouseLeave={(e) => {
                if (currentTrack) e.currentTarget.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.7))";
              }}
            >
              <SkipBack size={18} />
            </button>

            {/* Liner Play / Pause Morph Action Button */}
            <button
              onClick={togglePlay}
              disabled={!currentTrack || isResolving}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent-primary, #ff4d4d)",
                border: "none",
                color: "#ffffff",
                cursor: currentTrack ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(255, 77, 77, 0.4)",
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isResolving ? (
                <span style={{ fontSize: 9 }}>...</span>
              ) : isPlaying ? (
                <Pause size={15} fill="#ffffff" />
              ) : (
                <Play size={15} fill="#ffffff" style={{ marginLeft: 2 }} />
              )}
            </button>

            <button
              onClick={playNextTrack}
              disabled={!currentTrack}
              style={{
                background: "transparent",
                border: "none",
                color: currentTrack ? "var(--text-secondary, rgba(255, 255, 255, 0.7))" : "rgba(255,255,255,0.2)",
                cursor: currentTrack ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                padding: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (currentTrack) e.currentTarget.style.color = "var(--text-primary, #ffffff)";
              }}
              onMouseLeave={(e) => {
                if (currentTrack) e.currentTarget.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.7))";
              }}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 440 }}>
            <span style={{ fontSize: 11, color: "var(--text-tertiary, rgba(255, 255, 255, 0.45))", minWidth: 30, textAlign: "right" }}>
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
                height: 3,
                accentColor: "var(--accent-primary, #ff4d4d)",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-tertiary, rgba(255, 255, 255, 0.45))", minWidth: 30 }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Column 3: Volume & Fullscreen Toggle (Right 260px) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 14,
            paddingRight: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Volume Control */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={() => setVolumeHover(true)}
            onMouseLeave={() => setVolumeHover(false)}
          >
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              style={{ background: "transparent", border: "none", color: "var(--text-secondary, rgba(255,255,255,0.7))", cursor: "pointer", padding: 0 }}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: 72,
                height: 3,
                accentColor: "var(--accent-primary, #ff4d4d)",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Fullscreen Player Trigger */}
          <button
            onClick={onOpenNowPlaying}
            title="Expand Fullscreen (Now Playing)"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.7))",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary, #ffffff)";
              e.currentTarget.style.background = "var(--fill-hover, rgba(255, 255, 255, 0.1))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.7))";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
