import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Upload, Clock, User, BarChart2, Loader2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const summary = await invoke<AnalyticsSummary>("get_analytics_data");
      setData(summary);
    } catch (e: any) {
      console.warn("Could not fetch analytics data:", e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleImportSimpMusic = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SimpMusic Database", extensions: ["db", "sqlite", "sqlite3"] }],
      });

      if (selected && typeof selected === "string") {
        setLoading(true);
        setError(null);
        try {
          const summary = await invoke<AnalyticsSummary>("import_simpmusic_db", { filePath: selected });
          setData(summary);
        } catch (err: any) {
          setError(typeof err === "string" ? err : JSON.stringify(err));
        } finally {
          setLoading(false);
        }
      }
    } catch (e: any) {
      setError(e.toString());
    }
  };

  const chartData = (data?.hourly_stats || []).map((s) => ({
    time: `${s.hour.toString().padStart(2, "0")}:00`,
    plays: s.count,
  }));

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary, #ffffff)" }}>
            Listening Analytics
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #9ca3af)", fontSize: 14 }}>
            Import your listening history from SimpMusic and visualize your listening habits
          </p>
        </div>

        <button
          onClick={handleImportSimpMusic}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent-primary, #e11d48)",
            border: "none",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{loading ? "Importing Database..." : "Import from SimpMusic"}</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 8,
            color: "#fca5a5",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted, #6b7280)", fontSize: 13, marginBottom: 8 }}>
            <BarChart2 size={16} />
            <span>TOTAL PLAYS</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
            {data?.total_events.toLocaleString() || 0}
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted, #6b7280)", fontSize: 13, marginBottom: 8 }}>
            <User size={16} />
            <span>TOP ARTIST</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary, #ffffff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data?.top_artists?.[0]?.name || "N/A"}
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--card-bg, #141820)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted, #6b7280)", fontSize: 13, marginBottom: 8 }}>
            <Clock size={16} />
            <span>PEAK HOUR</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary, #ffffff)" }}>
            {(() => {
              if (!data?.hourly_stats) return "N/A";
              let maxCount = -1;
              let peakHour = 0;
              data.hourly_stats.forEach((s) => {
                if (s.count > maxCount) {
                  maxCount = s.count;
                  peakHour = s.hour;
                }
              });
              return maxCount > 0 ? `${peakHour}:00` : "N/A";
            })()}
          </div>
        </div>
      </div>

      {/* Listening Clock Chart */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-primary, #ffffff)" }}>
          Listening Clock (Plays by Hour of Day)
        </h2>
        <div
          style={{
            padding: "24px 20px 10px 10px",
            background: "var(--card-bg, #141820)",
            borderRadius: 14,
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
            height: 300,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="var(--text-muted, #6b7280)" fontSize={12} />
              <YAxis stroke="var(--text-muted, #6b7280)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1e1e2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#ffffff",
                }}
              />
              <Bar dataKey="plays" fill="var(--accent-primary, #e11d48)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top Artists List */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-primary, #ffffff)" }}>
          Top Artists
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(data?.top_artists || []).length === 0 ? (
            <div style={{ color: "var(--text-muted, #6b7280)", fontSize: 14 }}>
              No playback data yet. Click &quot;Import from SimpMusic&quot; above to import your listening history.
            </div>
          ) : (
            data?.top_artists.map((artist, idx) => {
              const maxPlays = data.top_artists[0]?.count || 1;
              const pct = Math.round((artist.count / maxPlays) * 100);
              return (
                <div
                  key={artist.name}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 10,
                    background: "var(--card-bg, #141820)",
                    border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted, #6b7280)", width: 24 }}>
                    #{idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #ffffff)" }}>
                        {artist.name}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-secondary, #9ca3af)" }}>
                        {artist.count.toLocaleString()} plays
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 3,
                          background: "var(--accent-primary, #e11d48)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
