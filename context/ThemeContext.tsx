import React, { createContext, useContext, useEffect } from "react";
import linerDark from "@/themes/liner-dark.json";
import glass from "@/themes/glass.json";
import nord from "@/themes/nord.json";
import catppuccin from "@/themes/catppuccin.json";
import gruvbox from "@/themes/gruvbox.json";
import { extractPalette } from "@/lib/paletteExtractor";

export type ThemeType = "Liner Dark" | "Glass" | "Nord" | "Catppuccin" | "Gruvbox" | "Auto";

interface ThemeContextType {
  currentTheme: ThemeType;
  applyTheme: (theme: ThemeType, albumArt?: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "Liner Dark",
  applyTheme: () => {},
});

const themeMap: Record<string, Record<string, string>> = {
  "liner-dark": linerDark.variables,
  "glass": glass.variables,
  "nord": nord.variables,
  "catppuccin": catppuccin.variables,
  "gruvbox": gruvbox.variables,
};

export const ThemeProvider: React.FC<{
  theme: ThemeType;
  albumArt?: string;
  children: React.ReactNode;
}> = ({ theme, albumArt, children }) => {
  const applyTheme = async (selectedTheme: ThemeType, artUrl?: string) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (selectedTheme === "Auto" && artUrl) {
      try {
        const palette = await extractPalette(artUrl, "Auto (Beta)");
        root.style.setProperty("--bg-primary", "#0d0f12");
        root.style.setProperty("--bg-secondary", "#14171d");
        root.style.setProperty("--bg-surface", "rgba(255, 255, 255, 0.08)");
        root.style.setProperty("--bg-surface-hover", "rgba(255, 255, 255, 0.15)");
        root.style.setProperty("--text-primary", "#ffffff");
        root.style.setProperty("--text-secondary", "#cbd5e1");
        root.style.setProperty("--text-muted", "#94a3b8");
        root.style.setProperty("--accent-primary", palette.primary || "#e11d48");
        root.style.setProperty("--accent-hover", palette.secondary || "#f43f5e");
        root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.1)");
        root.style.setProperty("--card-bg", "rgba(20, 24, 32, 0.7)");
        root.style.setProperty("--player-bg", "rgba(15, 18, 23, 0.95)");
        root.style.setProperty("--sidebar-bg", "rgba(10, 12, 14, 0.95)");
        return;
      } catch (e) {
        console.warn("Failed to extract auto theme palette, falling back to Liner Dark", e);
      }
    }

    const key = selectedTheme.toLowerCase().replace(/\s+/g, "-");
    const vars = themeMap[key] || linerDark.variables;
    Object.entries(vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });
  };

  useEffect(() => {
    applyTheme(theme, albumArt);
  }, [theme, albumArt]);

  return (
    <ThemeContext.Provider value={{ currentTheme: theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
