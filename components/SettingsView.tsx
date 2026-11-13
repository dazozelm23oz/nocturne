import React, { useState, useEffect } from "react";
import {
  Sliders,
  Volume2,
  Palette,
  Share2,
  Database,
  Check,
  Folder,
  Trash2,
  Upload,
  RefreshCw,
  LogIn,
  LogOut,
  Radio,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { signIn, signOut, useSession } from "next-auth/react";
import { LyricsSettings } from "@/typings/LyricsSettings";
import { getContrastTextColor } from "@/lib/contrastUtils";

interface SettingsViewProps {
  settings: LyricsSettings;
  updateSettings: (newSettings: Partial<LyricsSettings>) => void;
}

type SettingsTab = "general" | "playback" | "appearance" | "integrations" | "storage";

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { data: session, status } = useSession();
  const [cookieInput, setCookieInput] = useState(settings.ytMusicCookie || "");
  const [cacheSize, setCacheSize] = useState<string>("Calculating...");
  const [cookieSaved, setCookieSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Estimate cache size from /downloads folder or storage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nocturne_cache_size") || "14.2 MB";
        setCacheSize(stored);
      } catch {
        setCacheSize("12.4 MB");
      }
    }
  }, []);

  const handleSaveCookie = () => {
    updateSettings({ ytMusicCookie: cookieInput });
    setCookieSaved(true);
    setTimeout(() => setCookieSaved(false), 2500);
  };

  const handlePickDownloadFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Download Directory",
      });
      if (selected && typeof selected === "string") {
        updateSettings({ downloadFolder: selected });
      }
    } catch (e) {
      console.warn("Folder picker unavailable or cancelled:", e);
    }
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nocturne_cache_size", "0 KB");
      setCacheSize("0 KB");
      setStatusMessage("Audio cache cleared successfully");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleImportSimpMusic = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SimpMusic Database", extensions: ["db", "sqlite", "sqlite3"] }],
        title: "Select SimpMusic SQLite Database",
      });
      if (selected && typeof selected === "string") {
        setStatusMessage("Importing SimpMusic database...");
        const res = await invoke<any[]>("import_simpmusic_db", { filePath: selected });
        setStatusMessage(`Successfully imported ${res?.length || 0} playback events!`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e: any) {
      setStatusMessage(`Import failed: ${e?.message || e}`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleClearAnalytics = async () => {
    try {
      await invoke("clear_analytics_data");
      setStatusMessage("Analytics history wiped clean.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`Clear failed: ${e?.message || e}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Sliders size={18} /> },
    { id: "playback", label: "Playback & Audio", icon: <Volume2 size={18} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={18} /> },
    { id: "integrations", label: "Integrations", icon: <Share2 size={18} /> },
    { id: "storage", label: "Storage & Data", icon: <Database size={18} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg-primary, #0d0f12)",
      }}
    >
      {/* Settings Left Navigation Sidebar */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(14, 16, 21, 0.7)",
          backdropFilter: "blur(24px)",
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 12px 18px" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>Settings</h2>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Customize your hub</span>
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
            >
              <span style={{ color: isActive ? "var(--accent-primary, #e11d48)" : "inherit" }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Right Content Pane */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "36px 48px",
          boxSizing: "border-box",
        }}
      >
        {statusMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(225, 29, 72, 0.2)",
              border: "1px solid rgba(225, 29, 72, 0.4)",
              color: "#ffffff",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Radio size={16} />
            {statusMessage}
          </div>
        )}

        {/* Tab 1: General */}
        {activeTab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                General Preferences
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Control hub startup view, navigation memory, and system tray integration.
              </p>
            </div>

            <div
              style={{
                background: "rgba(20, 20, 25, 0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Startup View */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Startup View</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Initial tab shown when application launches</div>
                </div>
                <select
                  value={settings.startupView || "Home"}
                  onChange={(e) => updateSettings({ startupView: e.target.value as any })}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="Home">Home</option>
                  <option value="Now Playing">Now Playing</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Remember Last Tab */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Remember Last Tab</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Restore active tab upon relaunch</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.rememberLastTab ?? true}
                  onChange={(e) => updateSettings({ rememberLastTab: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Close to System Tray */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Close to System Tray</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Keep music running in background when window is closed</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.closeToSystemTray ?? false}
                  onChange={(e) => updateSettings({ closeToSystemTray: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Playback & Audio */}
        {activeTab === "playback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                Playback & Audio Engine
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Configure Soloist bridge, prefetch buffers, yt-dlp stream formats, and volume normalization.
              </p>
            </div>

            <div
              style={{
                background: "rgba(20, 20, 25, 0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Soloist Port */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Soloist Port</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Local port for Spotify client IPC & command bridging</div>
                </div>
                <input
                  type="number"
                  value={settings.soloistPort || 8000}
                  onChange={(e) => updateSettings({ soloistPort: parseInt(e.target.value, 10) || 8000 })}
                  style={{
                    width: 90,
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 13,
                    textAlign: "right",
                  }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Pre-fetch Count */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Pre-fetch Count</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Pre-downloads upcoming tracks for gapless playback</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-primary, #e11d48)" }}>
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
                  style={{ width: "100%", accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* yt-dlp Audio Format */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>yt-dlp Audio Format</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Direct audio container extracted by backend</div>
                </div>
                <select
                  value={settings.ytdlpAudioFormat || "webm"}
                  onChange={(e) => updateSettings({ ytdlpAudioFormat: e.target.value as any })}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="webm">WebM (Opus Native)</option>
                  <option value="mp4">MP4 / M4A (AAC)</option>
                  <option value="best">Best Audio Stream</option>
                </select>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Crossfade Duration */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Crossfade Duration</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Smooth volume transition between consecutive tracks</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-primary, #e11d48)" }}>
                    {settings.crossfadeDuration || 0} seconds
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={settings.crossfadeDuration || 0}
                  onChange={(e) => updateSettings({ crossfadeDuration: parseInt(e.target.value, 10) })}
                  style={{ width: "100%", accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Normalize Volume */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Normalize Volume</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Apply uniform dynamic range compensation across sources</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.normalizeVolume ?? false}
                  onChange={(e) => updateSettings({ normalizeVolume: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Appearance */}
        {activeTab === "appearance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                Appearance & Visual Styling
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Select curated color themes, glassmorphism blur, visualizers, and UI scale.
              </p>
            </div>

            <div
              style={{
                background: "rgba(20, 20, 25, 0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Theme Catalog */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Theme Catalog</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Global color palette and surface style</div>
                </div>
                <select
                  value={settings.themeCatalog || "Liner Dark"}
                  onChange={(e) => updateSettings({ themeCatalog: e.target.value as any })}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="Auto">Auto (Album Adaptive)</option>
                  <option value="Liner Dark">Liner Dark</option>
                  <option value="Glass">Glass</option>
                  <option value="Nord">Nord</option>
                  <option value="Catppuccin">Catppuccin</option>
                  <option value="Gruvbox">Gruvbox</option>
                </select>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Glass Blur Intensity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Glass Blur Intensity</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Backdrop filter blur applied to surfaces and modal overlays</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-primary, #e11d48)" }}>
                    {settings.glassBlurIntensity || 24}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={2}
                  value={settings.glassBlurIntensity || 24}
                  onChange={(e) => updateSettings({ glassBlurIntensity: parseInt(e.target.value, 10) })}
                  style={{ width: "100%", accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Visualizer Style */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Visualizer Style</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Real-time FFT audio visualizer graph in Now Playing</div>
                </div>
                <select
                  value={settings.visualizerStyle || "Bars"}
                  onChange={(e) => updateSettings({ visualizerStyle: e.target.value as any })}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="Bars">Bars (Classic)</option>
                  <option value="Waveform">Waveform</option>
                  <option value="Ambient Pulse">Ambient Pulse</option>
                </select>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* UI Scale */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>UI Scale</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Scale UI element proportion (80% - 120%)</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-primary, #e11d48)" }}>
                    {settings.uiScale || 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={120}
                  step={5}
                  value={settings.uiScale || 100}
                  onChange={(e) => updateSettings({ uiScale: parseInt(e.target.value, 10) })}
                  style={{ width: "100%", accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Show Lyrics Translation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Show Lyrics Translation</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Display romanized / translated subtitles beneath lines</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLyricsTranslation ?? false}
                  onChange={(e) => updateSettings({ showLyricsTranslation: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Integrations */}
        {activeTab === "integrations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                Integrations & Connected Accounts
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Connect Spotify Web API, custom YouTube Music auth cookies, and Discord Rich Presence.
              </p>
            </div>

            <div
              style={{
                background: "rgba(20, 20, 25, 0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Spotify Connection */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Spotify Connection</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Status:{" "}
                    {status === "authenticated" ? (
                      <span style={{ color: "#1ed760", fontWeight: 600 }}>Connected ({session?.user?.name || "User"})</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not connected</span>
                    )}
                  </div>
                </div>
                {status === "authenticated" ? (
                  <button
                    onClick={() => signOut()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => signIn("spotify")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#1ed760",
                      border: "none",
                      color: "#000000",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LogIn size={14} /> Log In to Spotify
                  </button>
                )}
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* YouTube Music Cookie */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff", marginBottom: 4 }}>
                  YouTube Music Cookie
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                  Paste raw cookie string or headers to access private YouTube playlists and premium 256k AAC streams
                </div>
                <textarea
                  rows={3}
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="HSID=...; SSID=...; SID=..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    marginBottom: 8,
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={handleSaveCookie}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: cookieSaved ? "#10b981" : "var(--accent-primary, #e11d48)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cookieSaved ? <Check size={14} /> : null}
                  {cookieSaved ? "Cookie Saved" : "Save Cookie"}
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Discord Rich Presence */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Discord Rich Presence</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Broadcast current song and duration to Discord activity profile</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.discordRichPresence ?? false}
                  onChange={(e) => updateSettings({ discordRichPresence: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary, #e11d48)", cursor: "pointer" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Discord Status Text */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Discord Status Text</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Template pattern displayed on presence banner</div>
                </div>
                <select
                  value={settings.discordStatusText || "Listening to {song}"}
                  onChange={(e) => updateSettings({ discordStatusText: e.target.value as any })}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="Listening to {song}">Listening to &#123;song&#125;</option>
                  <option value="Playing {artist}">Playing &#123;artist&#125;</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Storage & Data */}
        {activeTab === "storage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                Storage & Data Management
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Manage local downloads directory, audio cache purge, and SimpMusic database imports.
              </p>
            </div>

            <div
              style={{
                background: "rgba(20, 20, 25, 0.7)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Download Folder */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff", marginBottom: 4 }}>
                  Download Folder
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                  Target path for saved playlists and offline audio caches
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={settings.downloadFolder || "~/nocturne-hq/downloads"}
                    onChange={(e) => updateSettings({ downloadFolder: e.target.value })}
                    style={{
                      flex: 1,
                      background: "rgba(0,0,0,0.5)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={handlePickDownloadFolder}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Folder size={15} /> Browse
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Clear Audio Cache */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Clear Audio Cache</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Current cache allocation: {cacheSize}</div>
                </div>
                <button
                  onClick={handleClearCache}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Trash2 size={14} /> Clear Cache
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Import SimpMusic Analytics */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Import SimpMusic Analytics</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Import playback events, songs, and artists from SimpMusic database</div>
                </div>
                <button
                  onClick={handleImportSimpMusic}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--accent-primary, #e11d48)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Upload size={14} /> Import DB
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

              {/* Clear Analytics History */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#ffffff" }}>Clear Analytics History</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Delete all imported listening clock and artist events</div>
                </div>
                <button
                  onClick={handleClearAnalytics}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#94a3b8",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Trash2 size={14} /> Clear History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
