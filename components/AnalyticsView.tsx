import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Upload, Clock, User, BarChart2, Loader2, CheckCircle, Trash2 } from "lucide-react";

interface ArtistStat {
  name: string;
  count: number;
}

interface HourlyStat {
  hour: number;
  count: number;
}

interface AnalyticsSummary {
  total_events: number;
  top_artists: ArtistStat[];
  hourly_stats: HourlyStat[];
}

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const summary = await invoke<AnalyticsSummary>("get_analytics_data");
      setData(summary);
    } catch (e: any) {
      console.warn("Could not fetch analytics data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleImportDatabase = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SimpMusic Database", extensions: ["db", "sqlite", "sqlite3"] }],
        title: "Select SimpMusic SQLite Database File",
      });

      if (!selected || typeof selected !== "string") return;

      setLoading(true);
      setStatusMessage("Importing database records...");

      const records = await invoke<any[]>("import_simpmusic_db", { filePath: selected });
      setStatusMessage(`Successfully imported ${records?.length || 0} playback events!`);
      await fetchAnalytics();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.error("Import failed:", e);
      setStatusMessage(`Import failed: ${e?.message || e}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await invoke("clear_analytics_data");
      setData(null);
      setStatusMessage("Analytics data reset successfully.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`Clear failed: ${e?.message || e}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const maxArtistCount = data?.top_artists?.[0]?.count || 1;

  return (
    <div
      style={{
        padding: "36px 44px 100px",
        overflowY: "auto",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#ffffff" }}>
            Listening Analytics
          </h1>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
            Aggregated metrics, hourly listening patterns, and top artists from SimpMusic database.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleImportDatabase}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--accent-primary, #e11d48)",
              border: "none",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Upload size={16} /> Import SimpMusic DB
          </button>

          {data && data.total_events > 0 && (
            <button
              onClick={handleClear}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Trash2 size={15} /> Reset
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(225, 29, 72, 0.2)",
            border: "1px solid rgba(225, 29, 72, 0.4)",
            color: "#ffffff",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle size={16} />
          {statusMessage}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#94a3b8" }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Crunching listening event data...</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div
          style={{
            background: "rgba(20, 20, 25, 0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart2 size={16} color="var(--accent-primary, #e11d48)" /> Total Playback Events
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff" }}>
            {data?.total_events?.toLocaleString() || 0}
          </div>
        </div>

        <div
          style={{
            background: "rgba(20, 20, 25, 0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <User size={16} color="#38bdf8" /> Top Tracked Artists
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff" }}>
            {data?.top_artists?.length || 0}
          </div>
        </div>

        <div
          style={{
            background: "rgba(20, 20, 25, 0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={16} color="#a855f7" /> Peak Active Hour
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff" }}>
            {data?.hourly_stats
              ? `${[...data.hourly_stats].sort((a, b) => b.count - a.count)[0]?.hour || 0}:00`
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Listening Clock Bar Chart */}
      <div
        style={{
          background: "rgba(20, 20, 25, 0.7)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Clock size={18} color="var(--accent-primary, #e11d48)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff" }}>
            Listening Clock (Hourly Activity)
          </h2>
        </div>

        {(!data || data.total_events === 0) ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            No listening events found. Click &quot;Import SimpMusic DB&quot; to visualize your activity clock.
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => `${val}h`}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 18, 23, 0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    color: "#ffffff",
                    fontSize: 13,
                  }}
                  formatter={(value: any) => [`${value} plays`, "Activity"]}
                  labelFormatter={(label) => `${label}:00 - ${label}:59`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(data.hourly_stats || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? "var(--accent-primary, #e11d48)" : "rgba(255,255,255,0.1)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Artists List */}
      <div
        style={{
          background: "rgba(20, 20, 25, 0.7)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <User size={18} color="#38bdf8" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff" }}>
            Top Artists by Play Count
          </h2>
        </div>

        {(!data || data.top_artists.length === 0) ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            No top artists recorded. Import your database to populate.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.top_artists.map((artist, idx) => {
              const pct = Math.round((artist.count / maxArtistCount) * 100);
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          width: 22,
                          color: idx < 3 ? "var(--accent-primary, #e11d48)" : "#64748b",
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
                        {artist.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
                      {artist.count.toLocaleString()} plays
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background:
                          idx === 0
                            ? "var(--accent-primary, #e11d48)"
                            : "linear-gradient(90deg, var(--accent-primary, #e11d48), #38bdf8)",
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
