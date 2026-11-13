import React from "react";
import { Home, Search, Library, BarChart2, Settings } from "lucide-react";

export type NavTab = "home" | "search" | "library" | "analytics" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "search", label: "Search", icon: <Search size={20} /> },
    { id: "library", label: "Library", icon: <Library size={20} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside
      style={{
        width: 240,
        height: "100%",
        background: "var(--sidebar-bg, #0a0c0e)",
        borderRight: "1px solid var(--border-color, rgba(255,255,255,0.08))",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        boxSizing: "border-box",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 8px 24px",
          borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--accent-primary, #e11d48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(225, 29, 72, 0.4)",
          }}
        >
          🎵
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary, #ffffff)",
          }}
        >
          Nocturne
        </span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "var(--bg-surface-hover, rgba(255,255,255,0.1))" : "transparent",
                color: isActive ? "var(--accent-primary, #e11d48)" : "var(--text-secondary, #9ca3af)",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-surface, rgba(255,255,255,0.05))";
                  e.currentTarget.style.color = "var(--text-primary, #ffffff)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary, #9ca3af)";
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
