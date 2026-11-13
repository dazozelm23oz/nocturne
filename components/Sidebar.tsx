import React from "react";
import { Home, Search, Library, BarChart2, Settings } from "lucide-react";

export type NavTab = "home" | "search" | "library" | "analytics" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home size={19} /> },
    { id: "search", label: "Search", icon: <Search size={19} /> },
    { id: "library", label: "Library", icon: <Library size={19} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={19} /> },
    { id: "settings", label: "Settings", icon: <Settings size={19} /> },
  ];

  return (
    <aside
      style={{
        width: 230,
        height: "100%",
        background: "rgba(20, 20, 25, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        boxSizing: "border-box",
        userSelect: "none",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 8px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent-primary, #e11d48), #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)",
            fontSize: 18,
          }}
        >
          🎵
        </div>
        <div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              display: "block",
            }}
          >
            Nocturne
          </span>
          <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Music Hub
          </span>
        </div>
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
                padding: "11px 14px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: isActive ? "#ffffff" : "#94a3b8",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.transform = "translateX(2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
            >
              <span style={{ color: isActive ? "var(--accent-primary, #e11d48)" : "inherit" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
