import React from "react";
import { LyricsSettings, DEFAULT_LYRICS_SETTINGS } from "@/typings/LyricsSettings";

interface SettingsViewProps {
  settings: LyricsSettings;
  updateSettings: (newSettings: Partial<LyricsSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings }) => {
  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", boxSizing: "border-box", maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>
          Settings
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #9ca3af)", fontSize: 14 }}>
          Configure playback, themes, Soloist bridge, and system behavior
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Playback & Prefetching */}
        <section
          style={{
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #ffffff)", margin: "0 0 16px" }}>
            Playback & Prefetching
          </h2>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary, #ffffff)" }}>
                  Queue Prefetch Count
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted, #6b7280)", marginTop: 2 }}>
                  Pre-downloads upcoming tracks via the Python backend for seamless gapless playback
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-primary, #e11d48)" }}>
                {settings.prefetchCount || 2} tracks
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={settings.prefetchCount || 2}
              onChange={(e) => updateSettings({ prefetchCount: parseInt(e.target.value, 10) })}
              style={{
                width: "100%",
                height: 6,
                accentColor: "var(--accent-primary, #e11d48)",
                cursor: "pointer",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted, #6b7280)", marginTop: 4 }}>
              <span>1 track</span>
              <span>5 tracks</span>
            </div>
          </div>
        </section>

        {/* Appearance & Themes */}
        <section
          style={{
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #ffffff)", margin: "0 0 16px" }}>
            Appearance & Themes
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary, #ffffff)" }}>
                Theme Catalog
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #6b7280)", marginTop: 2 }}>
                Select an active aesthetic preset or dynamically sample the album art
              </div>
            </div>

            <select
              value={settings.themeCatalog || "Liner Dark"}
              onChange={(e) => updateSettings({ themeCatalog: e.target.value as any })}
              style={{
                padding: "8px 14px",
                background: "var(--bg-surface, #1a1f26)",
                border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
                borderRadius: 8,
                color: "var(--text-primary, #ffffff)",
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="Liner Dark">Liner Dark</option>
              <option value="Glass">Glass</option>
              <option value="Nord">Nord</option>
              <option value="Catppuccin">Catppuccin</option>
              <option value="Gruvbox">Gruvbox</option>
              <option value="Auto">Auto (Album Art)</option>
            </select>
          </div>
        </section>

        {/* Soloist Bridge */}
        <section
          style={{
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #ffffff)", margin: "0 0 16px" }}>
            Soloist Spotify Bridge
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary, #ffffff)" }}>
                Soloist Bridge Port
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #6b7280)", marginTop: 2 }}>
                Port of the local Soloist server for Spotify transport commands
              </div>
            </div>

            <input
              type="number"
              min={1024}
              max={65535}
              value={settings.soloistPort || 8000}
              onChange={(e) => updateSettings({ soloistPort: parseInt(e.target.value, 10) || 8000 })}
              style={{
                width: 100,
                padding: "8px 12px",
                background: "var(--bg-surface, #1a1f26)",
                border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
                borderRadius: 8,
                color: "var(--text-primary, #ffffff)",
                fontSize: 14,
                textAlign: "right",
                outline: "none",
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
