import React from "react";
import { Play } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { TrackItem, useQueue } from "@/context/QueueContext";

interface MixItem {
  id: string;
  title: string;
  description: string;
  color: string;
  tracks: TrackItem[];
}

const mockDailyMixes: MixItem[] = [
  {
    id: "mix-1",
    title: "Daily Mix 1",
    description: "Halsey, Lorde, Billie Eilish, Lana Del Rey",
    color: "linear-gradient(135deg, #e11d48, #4f46e5)",
    tracks: [
      { id: "h1", title: "Bad At Love", artist: "Halsey", source: "youtube" },
      { id: "h2", title: "Royals", artist: "Lorde", source: "youtube" },
      { id: "h3", title: "bad guy", artist: "Billie Eilish", source: "youtube" },
    ],
  },
  {
    id: "mix-2",
    title: "Chill Lo-Fi & Beats",
    description: "Relaxing study beats and mellow frequencies",
    color: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    tracks: [
      { id: "h4", title: "Passionfruit", artist: "Drake", source: "youtube" },
      { id: "h5", title: "Get You", artist: "Daniel Caesar", source: "youtube" },
    ],
  },
  {
    id: "mix-3",
    title: "Synthwave & Retrowave",
    description: "80s neon synth, retro electronica & driving night rhythms",
    color: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    tracks: [
      { id: "h6", title: "Resonance", artist: "HOME", source: "youtube" },
      { id: "h7", title: "Midnight City", artist: "M83", source: "youtube" },
    ],
  },
];

export const HomeView: React.FC = () => {
  const { playTrack } = usePlayer();
  const { setQueue } = useQueue();

  const handlePlayMix = (mix: MixItem) => {
    if (mix.tracks.length > 0) {
      setQueue(mix.tracks, 0);
      playTrack(mix.tracks[0]);
    }
  };

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>
          Good evening
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #9ca3af)", fontSize: 14 }}>
          Jump back in or explore your curated music feeds
        </p>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-primary, #ffffff)" }}>
          Made For You
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {mockDailyMixes.map((mix) => (
            <div
              key={mix.id}
              style={{
                borderRadius: 14,
                background: "var(--card-bg, #141820)",
                border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  height: 140,
                  borderRadius: 10,
                  background: mix.color,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 14,
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: "#ffffff" }}>{mix.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayMix(mix);
                  }}
                  title="Play Mix"
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Play size={20} fill="#000000" color="#000000" style={{ marginLeft: 2 }} />
                </button>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary, #9ca3af)", lineHeight: 1.4 }}>
                  {mix.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
