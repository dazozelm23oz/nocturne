import React, { useState, useEffect } from "react";
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

function Layout({
  settings,
  updateSettings,
}: {
  settings: LyricsSettings;
  updateSettings: (newSettings: Partial<LyricsSettings>) => void;
}) {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const { currentTrack } = usePlayer();

  return (
    <ThemeProvider theme={settings.themeCatalog || "Liner Dark"} albumArt={currentTrack?.coverArt}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "var(--bg-primary, #0d0f12)",
          color: "var(--text-primary, #ffffff)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center Main Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Window / App Header */}
          <TopHeader />

          {/* Tab Content View */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
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

          {/* Persistent Bottom Player Bar */}
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
          <Layout settings={settings} updateSettings={updateSettings} />
        </PlayerProvider>
      </QueueProvider>
    </>
  );
}
