import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft, ChevronRight, X, Minus, Radio } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

interface TopHeaderProps {
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
}) => {
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
        height: 50,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6px 0 0",
        boxSizing: "border-box",
        userSelect: "none",
        zIndex: 45,
        flexShrink: 0,
      }}
    >
      {/* Current Playing Status Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8 }}>
        {isPlaying && currentTrack ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 34,
              padding: "0 14px",
              borderRadius: 10,
              background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
              backdropFilter: "blur(24px)",
              border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary, rgba(255, 255, 255, 0.7))",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-primary, #ff4d4d)",
                boxShadow: "0 0 8px var(--accent-primary, #ff4d4d)",
              }}
            />
            <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: 600 }}>
              {currentTrack.title}
            </span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.04em" }}>
              {currentTrack.source}
            </span>
          </div>
        ) : (
          <div
            style={{
              height: 34,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              borderRadius: 10,
              background: "var(--fill-subtle, rgba(255, 255, 255, 0.04))",
              fontSize: 12,
              color: "var(--text-tertiary, rgba(255, 255, 255, 0.45))",
            }}
          >
            Liner Audio Core
          </div>
        )}
      </div>

      {/* Right Island Controls: Navigation Island & Window Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* History Nav Island */}
        <div
          style={{
            height: 38,
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "0 4px",
            borderRadius: 10,
            background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Back"
            style={{
              display: "flex",
              width: 26,
              height: 26,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-primary, #ffffff)",
              opacity: canGoBack ? 0.7 : 0.25,
              cursor: canGoBack ? "pointer" : "default",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onForward}
            disabled={!canGoForward}
            aria-label="Forward"
            style={{
              display: "flex",
              width: 26,
              height: 26,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-primary, #ffffff)",
              opacity: canGoForward ? 0.7 : 0.25,
              cursor: canGoForward ? "pointer" : "default",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Window Controls Island */}
        <div
          style={{
            height: 38,
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "0 4px",
            borderRadius: 10,
            background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
          }}
        >
          <button
            onClick={handleClose}
            title="Close"
            style={{
              display: "flex",
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.7))",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ff4d4d";
              e.currentTarget.style.background = "rgba(255, 77, 77, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.7))";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
