import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Minus } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

export const TopHeader: React.FC = () => {
  const { currentTrack, isPlaying } = usePlayer();

  const handleClose = async () => {
    try {
      await invoke("close_app");
    } catch {
      window.close();
    }
  };

  return (
    <header
      style={{
        height: 52,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
        background: "var(--bg-primary, #0d0f12)",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-muted, #6b7280)",
          }}
        >
          {isPlaying && currentTrack ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent-primary, #e11d48)",
                  boxShadow: "0 0 8px var(--accent-primary, #e11d48)",
                }}
              />
              Playing via {currentTrack.source.toUpperCase()}
            </span>
          ) : (
            "Ready to play"
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={handleClose}
          title="Close Nocturne"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted, #6b7280)",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff4d4f";
            e.currentTarget.style.background = "rgba(255, 77, 79, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted, #6b7280)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
};
