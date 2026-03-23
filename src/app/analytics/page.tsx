"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import { ChartData, ETAAccuracy } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { AssignmentsChart, OccupancyChart, TelemetryChart, RouteUsageChart } from "@/components/charts/Charts";
import { RefreshCw, Target, TrendingUp, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [a7, setA7] = useState<ChartData | null>(null);
  const [a30, setA30] = useState<ChartData | null>(null);
  const [occ, setOcc] = useState<ChartData | null>(null);
  const [tel, setTel] = useState<ChartData | null>(null);
  const [r7, setR7] = useState<ChartData | null>(null);
  const [r30, setR30] = useState<ChartData | null>(null);
  const [eta, setEta] = useState<ETAAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.allSettled([
        dashboardApi.assignmentsOverTime(7), dashboardApi.assignmentsOverTime(30),
        dashboardApi.occupancyDistribution(), dashboardApi.telemetryVolume(),
        dashboardApi.routeUsage(7), dashboardApi.routeUsage(30), dashboardApi.etaAccuracy(),
      ]);
      if (res[0].status === "fulfilled") setA7(res[0].value.data);
      if (res[1].status === "fulfilled") setA30(res[1].value.data);
      if (res[2].status === "fulfilled") setOcc(res[2].value.data);
      if (res[3].status === "fulfilled") setTel(res[3].value.data);
      if (res[4].status === "fulfilled") setR7(res[4].value.data);
      if (res[5].status === "fulfilled") setR30(res[5].value.data);
      if (res[6].status === "fulfilled") setEta(res[6].value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <PageLoader />;

  const assignments = period === 7 ? a7 : a30;
  const routeUsage = period === 7 ? r7 : r30;
  const totalTrips = assignments?.data.reduce((s, v) => s + v, 0) ?? 0;
  const mlBetter = eta && eta.ml_mae < eta.heuristic_mae;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Analytics</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>System performance & fleet insights</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10 }}>
            {([7, 14, 30] as const).map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", transition: "all 0.15s", background: period === d ? "var(--neon)" : "transparent", color: period === d ? "#000" : "var(--text-2)" }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* ETA comparison */}
      {eta && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Target size={15} color="var(--neon)" />
            <span className="section-title">ETA Model Comparison</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Heuristic Algorithm", val: eta.heuristic_mae, color: "var(--amber)", active: !mlBetter, desc: "Haversine + peak multipliers + dwell time" },
              { label: "ML Model (RandomForest)", val: eta.ml_mae, color: "var(--neon)", active: !!mlBetter, desc: "Trained on real trip history · improves over time" },
            ].map(m => (
              <div key={m.label} style={{ borderRadius: 10, padding: 14, background: m.active ? "var(--neon-dim)" : "var(--bg-3)", border: `1px solid ${m.active ? "var(--neon-border)" : "var(--border)"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text)" }}>{m.label}</span>
                    {m.active && <span className="badge-neon badge" style={{ fontSize: 9 }}>Active</span>}
                  </div>
                  <TrendingUp size={13} color="var(--text-3)" />
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: m.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em", marginBottom: 4 }}>{m.val}s</p>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>Mean Absolute Error</p>
                <div style={{ height: 4, borderRadius: 99, overflow: "hidden", background: "var(--bg-4)" }}>
                  <div style={{ height: "100%", width: `${Math.min((m.val / 300) * 100, 100)}%`, background: m.color, transition: "width 0.7s ease" }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>{m.desc}</p>
              </div>
            ))}
          </div>
          {mlBetter && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "var(--green-dim)", border: "1px solid var(--green-border)", color: "var(--green)", fontSize: 13 }}>
              <TrendingUp size={14} />
              ML model is <strong>{(((eta.heuristic_mae - eta.ml_mae) / eta.heuristic_mae) * 100).toFixed(1)}%</strong> more accurate. Enable it in Settings.
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { icon: <BarChart3 size={15} />, label: `Total Trips (${period}d)`, val: totalTrips, color: "var(--neon)" },
          { icon: <BarChart3 size={15} />, label: "Avg/Day", val: Math.round(totalTrips / period * 10) / 10, color: "var(--cyan)" },
          { icon: <Target size={15} />, label: "Heuristic MAE", val: `${eta?.heuristic_mae ?? 0}s`, color: "var(--amber)" },
          { icon: <TrendingUp size={15} />, label: "ML MAE", val: `${eta?.ml_mae ?? 0}s`, color: eta && eta.ml_mae < eta.heuristic_mae ? "var(--green)" : "var(--neon)" },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ textAlign: "center" }}>
            <span style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: s.color }}>{s.icon}</span>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-display)" }}>{s.val}</p>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {assignments && <div className="card"><p className="section-title" style={{ marginBottom: 14 }}>Assignments — Last {period} Days</p><AssignmentsChart data={assignments} /></div>}
        {routeUsage && <div className="card"><p className="section-title" style={{ marginBottom: 14 }}>Route Usage — Last {period} Days</p><RouteUsageChart data={routeUsage} /></div>}
        {occ && <div className="card"><p className="section-title" style={{ marginBottom: 14 }}>Occupancy Distribution</p><OccupancyChart data={occ} /></div>}
        {tel && <div className="card"><p className="section-title" style={{ marginBottom: 14 }}>Telemetry Volume — Last 24h</p><TelemetryChart data={tel} /></div>}
      </div>
    </div>
  );
}
