/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { Search as SearchIcon, Play, Plus, Loader2, Music } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";

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

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<TrackItem[]>([]);
  const { playTrack } = usePlayer();
  const { addToQueue } = useQueue();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/resolve?title=${encodeURIComponent(q)}&artist=`);
      if (res.ok) {
        const data = await res.json();
        const foundTrack: TrackItem = {
          id: `search-${Date.now()}`,
          title: data.title || q,
          artist: data.artist || "YouTube Audio",
          source: "youtube",
          url: data.url,
        };
        setResults([foundTrack]);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      style={{
        padding: "36px 44px 100px",
        overflowY: "auto",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#ffffff" }}>
          Search
        </h1>
        <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
          Discover songs, artists, and live streams across YouTube Music and local library
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(20, 20, 25, 0.7)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 12,
            padding: "0 18px",
            maxWidth: 620,
            transition: "border-color 0.2s ease",
          }}
        >
          <SearchIcon size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tracks, artists, or paste a title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              height: 48,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: 15,
            }}
          />
          {isSearching ? (
            <Loader2 size={18} className="animate-spin" color="var(--accent-primary, #e11d48)" />
          ) : (
            <button
              type="submit"
              style={{
                background: "var(--accent-primary, #e11d48)",
                border: "none",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          )}
        </div>
      </form>

      {isSearching && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 620 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 64,
                borderRadius: 12,
                background: "rgba(20, 20, 25, 0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          ))}
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <section style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#ffffff" }}>
            Search Results
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((track) => (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "rgba(20, 20, 25, 0.7)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.borderColor = "var(--accent-primary, #e11d48)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <ImageWithFallback
                      src={track.coverArt}
                      alt={track.title}
                      fallbackText={track.title}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => addToQueue(track)}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      padding: "8px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Plus size={15} />
                    <span>Queue</span>
                  </button>

                  <button
                    onClick={() => playTrack(track)}
                    style={{
                      background: "var(--accent-primary, #e11d48)",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 18px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Play size={15} fill="#ffffff" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "rgba(20, 20, 25, 0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            maxWidth: 620,
          }}
        >
          <Music size={40} color="#64748b" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", color: "#ffffff", fontSize: 16 }}>No tracks found</h3>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Could not find any matching audio for &quot;{query}&quot;. Try different keywords.
          </p>
        </div>
      )}
    </div>
  );
};
