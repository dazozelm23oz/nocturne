import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { LyricsSettings } from "@/typings/LyricsSettings";
import VinylTurntable from "./VinylTurntable";

interface LyricLine {
  startTimeMs: number;
  words: string;
  syllables?: { text: string; offsetMs: number; durationMs: number }[];
}

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LyricsSettings;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ isOpen, onClose, settings }) => {
  const { currentTrack, isPlaying, progress, duration, frequencyData, togglePlay, seek, playNextTrack, playPrevTrack } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack?.title) {
      setLyrics([]);
      return;
    }

    let isMounted = true;
    setLyricsLoading(true);

    const fetchLyrics = async () => {
      try {
        const query = new URLSearchParams({
          track: currentTrack.title,
          artist: currentTrack.artist || "",
          duration: (currentTrack.duration || 180).toString(),
        });
        const res = await fetch(`/api/lyrics?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data?.lyrics?.lines) {
              setLyrics(data.lyrics.lines);
            } else if (Array.isArray(data?.lines)) {
              setLyrics(data.lines);
            } else {
              setLyrics([]);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load lyrics:", err);
        if (isMounted) setLyrics([]);
      } finally {
        if (isMounted) setLyricsLoading(false);
      }
    };

    fetchLyrics();
    return () => {
      isMounted = false;
    };
  }, [currentTrack?.title, currentTrack?.artist]);

  // Auto-scroll lyrics to active line
  const progressMs = progress * 1000;
  const activeIndex = lyrics.findIndex((line, i) => {
    const nextLine = lyrics[i + 1];
    return progressMs >= line.startTimeMs && (!nextLine || progressMs < nextLine.startTimeMs);
  });

  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--bg-primary, #0d0f12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Top Bar with Dismiss */}
      <div
        style={{
          height: 60,
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          title="Minimize (Esc)"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            color: "var(--text-primary, #ffffff)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronDown size={20} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted, #6b7280)" }}>
            NOW PLAYING
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
            {currentTrack?.title || "Unknown Title"}
          </div>
        </div>

        <div style={{ width: 36 }} />
      </div>

      {/* Main Content: Left Column (Art/Turntable) & Right Column (Lyrics) */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          padding: "20px 48px 40px",
          gap: 48,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Left Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            height: "100%",
          }}
        >
          {settings.vinylMode ? (
            <div style={{ width: 320, height: 320, position: "relative", marginBottom: 28 }}>
              <VinylTurntable
                songImage={currentTrack?.coverArt || "/icons/128x128.png"}
                isPlaying={isPlaying}
                trackName={currentTrack?.title || "Track"}
                onTogglePlay={togglePlay}
                primaryColor="var(--accent-primary, #e11d48)"
                vinylStyle={settings.vinylStyle || "Turntable Deck"}
              />
            </div>
          ) : (
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                marginBottom: 28,
                background: "var(--bg-surface, #1a1f26)",
              }}
            >
              {currentTrack?.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt="Cover"
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
                    fontSize: 80,
                    background: "linear-gradient(135deg, var(--accent-primary, #e11d48), #3b82f6)",
                  }}
                >
                  🎵
                </div>
              )}
            </div>
          )}

          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text-primary, #ffffff)",
              margin: "0 0 6px",
              maxWidth: 420,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentTrack?.title || "No Track"}
          </h2>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-secondary, #9ca3af)",
              margin: 0,
              maxWidth: 420,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentTrack?.artist || "Select a song"}
          </h3>

          {/* Mini Spectrum Visualizer under art */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
              height: 36,
              marginTop: 24,
            }}
          >
            {Array.from(frequencyData.slice(0, 32)).map((val, idx) => {
              const h = Math.max(4, (val / 255) * 36);
              return (
                <div
                  key={idx}
                  style={{
                    width: 4,
                    height: h,
                    borderRadius: 2,
                    background: "var(--accent-primary, #e11d48)",
                    opacity: 0.85,
                    transition: "height 0.08s ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Synced Lyrics */}
        <div
          ref={scrollContainerRef}
          style={{
            height: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: "40px 20px",
            boxSizing: "border-box",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
        >
          {lyricsLoading ? (
            <div style={{ textAlign: "center", color: "var(--text-muted, #6b7280)", marginTop: 120 }}>
              Loading synchronized lyrics...
            </div>
          ) : lyrics.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted, #6b7280)", marginTop: 120 }}>
              <Music size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div>No synchronized lyrics found for this song.</div>
            </div>
          ) : (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.startTimeMs / 1000)}
                  style={{
                    fontSize: isActive ? 32 : 24,
                    fontWeight: isActive ? 700 : 500,
                    lineHeight: 1.4,
                    color: isActive ? "var(--text-primary, #ffffff)" : "var(--text-muted, #6b7280)",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "left center",
                    textShadow: isActive ? "0 0 24px rgba(255,255,255,0.4)" : "none",
                  }}
                >
                  {line.words}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
