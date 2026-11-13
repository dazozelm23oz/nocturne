import React, { useState } from "react";
import Head from "next/head";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { PlayerBar } from "@/components/PlayerBar";
import { HomeView } from "@/components/HomeView";
import { SearchView } from "@/components/SearchView";
import { LibraryView } from "@/components/LibraryView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { NowPlayingModal } from "@/components/NowPlayingModal";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueueProvider } from "@/context/QueueContext";
import { PlayerProvider, usePlayer } from "@/context/PlayerContext";
import { LyricsSettings, DEFAULT_LYRICS_SETTINGS } from "@/typings/LyricsSettings";

function LinerShell({
  settings,
  updateSettings,
}: {
  settings: LyricsSettings;
  updateSettings: (newSettings: Partial<LyricsSettings>) => void;
}) {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined" && settings.rememberLastTab) {
      const saved = localStorage.getItem("nocturne_last_tab") as NavTab;
      if (saved) return saved;
    }
    if (settings.startupView === "Library") return "library";
    return "home";
  });

  const [history, setHistory] = useState<NavTab[]>([activeTab]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(
    settings.startupView === "Now Playing"
  );
  const { currentTrack } = usePlayer();

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), tab]);
    setHistoryIndex((prev) => prev + 1);
    if (typeof window !== "undefined" && settings.rememberLastTab) {
      localStorage.setItem("nocturne_last_tab", tab);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setActiveTab(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setActiveTab(history[newIndex]);
    }
  };

  const scaleFactor = (settings.uiScale || 100) / 100;

  return (
    <ThemeProvider theme={settings.themeCatalog || "Liner Dark"} albumArt={currentTrack?.coverArt}>
      {/* 
        Liner 1:1 App Shell Container:
        - Exact 6px shell edge gap & outer padding
        - 52px left sidebar
        - 50px top header island
        - Floating main glass container (12px rounded-item)
        - 64px bottom floating mini player
      */}
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          padding: 6,
          gap: 6,
          boxSizing: "border-box",
          background: "#000000",
          color: "var(--text-primary, #ffffff)",
          zoom: scaleFactor !== 1 ? scaleFactor : undefined,
          fontFamily:
            '"SF Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          userSelect: "none",
        }}
      >
        {/* Left Narrow 52px Sidebar Island */}
        <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} />

        {/* Right Application Column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            gap: 6,
            minWidth: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Header Island */}
          <TopHeader
            onBack={handleBack}
            onForward={handleForward}
            canGoBack={historyIndex > 0}
            canGoForward={historyIndex < history.length - 1}
          />

          {/* Main Floating Glass Surface (12px rounded-item) */}
          <main
            style={{
              flex: 1,
              borderRadius: 12,
              background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
              minHeight: 0,
            }}
          >
            {activeTab === "home" && <HomeView />}
            {activeTab === "search" && <SearchView />}
            {activeTab === "library" && <LibraryView />}
            {activeTab === "analytics" && <AnalyticsView />}
            {activeTab === "settings" && (
              <SettingsView settings={settings} updateSettings={updateSettings} />
            )}
          </main>

          {/* Bottom Floating MiniPlayer (64px) */}
          <PlayerBar onOpenNowPlaying={() => setIsNowPlayingOpen(true)} />
        </div>

        {/* Fullscreen Now Playing Overlay Modal */}
        <NowPlayingModal
          isOpen={isNowPlayingOpen}
          onClose={() => setIsNowPlayingOpen(false)}
          settings={settings}
        />
      </div>
    </ThemeProvider>
  );
}

export default function IndexPage() {
  const [settings, setSettings] = useState<LyricsSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nocturne_settings");
        if (saved) return { ...DEFAULT_LYRICS_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.warn("Failed to load settings from storage:", e);
      }
    }
    return DEFAULT_LYRICS_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<LyricsSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("nocturne_settings", JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save settings to storage:", e);
        }
      }
      return updated;
    });
  };

  return (
    <>
      <Head>
        <title>Nocturne</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <QueueProvider settings={settings}>
        <PlayerProvider settings={settings}>
          <LinerShell settings={settings} updateSettings={updateSettings} />
        </PlayerProvider>
      </QueueProvider>
    </>
  );
}
