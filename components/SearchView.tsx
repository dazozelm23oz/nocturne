import React, { useState } from "react";
import { Search as SearchIcon, Play, Plus, Loader2 } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TrackItem[]>([]);
  const { playTrack } = usePlayer();
  const { addToQueue } = useQueue();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Query python resolver/search or construct candidate track
      const q = query.trim();
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
        // Fallback candidate
        setResults([
          {
            id: `search-${Date.now()}`,
            title: q,
            artist: "YouTube",
            source: "youtube",
          },
        ]);
      }
    } catch {
      setResults([
        {
          id: `search-${Date.now()}`,
          title: query.trim(),
          artist: "YouTube",
          source: "youtube",
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>
          Search
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #9ca3af)", fontSize: 14 }}>
          Find songs, artists, or albums across YouTube and local media
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--bg-surface, #1a1f26)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
            borderRadius: 12,
            padding: "0 16px",
            maxWidth: 580,
          }}
        >
          <SearchIcon size={20} color="var(--text-muted, #6b7280)" />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              height: 46,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary, #ffffff)",
              fontSize: 15,
            }}
          />
          {isSearching && <Loader2 size={18} className="animate-spin" color="var(--accent-primary, #e11d48)" />}
        </div>
      </form>

      {results.length > 0 ? (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-primary, #ffffff)" }}>
            Search Results
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((track) => (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "var(--card-bg, #141820)",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "var(--bg-surface, #222933)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    🎵
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary, #9ca3af)" }}>
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => addToQueue(track)}
                    title="Add to queue"
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
                      color: "var(--text-primary, #ffffff)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                    }}
                  >
                    <Plus size={16} />
                    <span>Queue</span>
                  </button>

                  <button
                    onClick={() => playTrack(track)}
                    style={{
                      background: "var(--accent-primary, #e11d48)",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Play size={16} fill="#ffffff" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : query && !isSearching ? (
        <div style={{ color: "var(--text-muted, #6b7280)", fontSize: 14 }}>Press Enter to search for &quot;{query}&quot;</div>
      ) : null}
    </div>
  );
};
