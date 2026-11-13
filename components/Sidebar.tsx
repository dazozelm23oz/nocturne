/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Home, Search, Library, BarChart2, Settings } from "lucide-react";

export type NavTab = "home" | "search" | "library" | "analytics" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home size={22} /> },
    { id: "search", label: "Search", icon: <Search size={22} /> },
    { id: "library", label: "Library", icon: <Library size={22} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={22} /> },
    { id: "settings", label: "Settings", icon: <Settings size={22} /> },
  ];

  return (
    <aside
      style={{
        width: 52,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        userSelect: "none",
        zIndex: 45,
        flexShrink: 0,
      }}
    >
      {/* Liner 1:1 Glass Island: hugs navigation items */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 12,
          background: "var(--bg-glass, rgba(70, 70, 70, 0.2))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid var(--border-white-alpha-14, rgba(255, 255, 255, 0.08))",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          padding: "16px 0",
          boxSizing: "border-box",
        }}
      >
        {/* Liner Brand Logo */}
        <button
          onClick={() => onSelectTab("home")}
          title="Liner • Nocturne"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <img
            src="/liner-logo.svg"
            alt="Liner"
            style={{ width: 28, height: 22, objectFit: "contain" }}
            draggable={false}
          />
        </button>

        {/* Navigation Items */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            width: "100%",
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                aria-label={item.label}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  background: isActive ? "var(--fill-strong, rgba(255, 255, 255, 0.14))" : "transparent",
                  color: isActive ? "var(--accent-primary, #ff4d4d)" : "var(--text-primary, #ffffff)",
                  opacity: isActive ? 1 : 0.55,
                  cursor: "pointer",
                  transition: "all 0.15s ease-out",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = "0.95";
                    e.currentTarget.style.background = "var(--fill-hover, rgba(255, 255, 255, 0.1))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = "0.55";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {item.icon}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: -1,
                      width: 3,
                      height: 16,
                      borderRadius: "0 2px 2px 0",
                      background: "var(--accent-primary, #ff4d4d)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
