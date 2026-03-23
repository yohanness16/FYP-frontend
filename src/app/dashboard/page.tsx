"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import { DashboardSummary, ChartData, ETAAccuracy } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { PageLoader } from "@/components/ui/Spinner";
import { AssignmentsChart, OccupancyChart, TelemetryChart, RouteUsageChart } from "@/components/charts/Charts";
import { Radio, Bus, Route, Users, Activity, RefreshCw, Target } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assignments, setAssignments] = useState<ChartData | null>(null);
  const [occupancy, setOccupancy] = useState<ChartData | null>(null);
  const [telemetry, setTelemetry] = useState<ChartData | null>(null);
  const [routeUsage, setRouteUsage] = useState<ChartData | null>(null);
  const [eta, setEta] = useState<ETAAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [s, a, o, t, r, e] = await Promise.allSettled([
        dashboardApi.summary(), dashboardApi.assignmentsOverTime(7),
        dashboardApi.occupancyDistribution(), dashboardApi.telemetryVolume(),
        dashboardApi.routeUsage(30), dashboardApi.etaAccuracy(),
      ]);
      if (s.status === "fulfilled") setSummary(s.value.data);
      if (a.status === "fulfilled") setAssignments(a.value.data);
      if (o.status === "fulfilled") setOccupancy(o.value.data);
      if (t.status === "fulfilled") setTelemetry(t.value.data);
      if (r.status === "fulfilled") setRouteUsage(r.value.data);
      if (e.status === "fulfilled") setEta(e.value.data);
      setLastUpdated(new Date());
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(() => load(true), 30000); return () => clearInterval(iv); }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Fleet Overview</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
            Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary" style={{ gap: 6 }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        <StatCard title="Active Trips"    value={summary?.active_assignments ?? "—"} subtitle="Live now"    icon={<Radio size={17} />}    accent="green" />
        <StatCard title="Vehicles"        value={summary?.vehicles ?? "—"}           subtitle="Registered"  icon={<Bus size={17} />}      accent="neon" />
        <StatCard title="Routes"          value={summary?.routes ?? "—"}             subtitle="Configured"  icon={<Route size={17} />}    accent="cyan" />
        <StatCard title="Users"           value={summary?.users ?? "—"}              subtitle="All roles"   icon={<Users size={17} />}    accent="purple" />
        <StatCard title="Telemetry 24h"   value={summary?.telemetry_last_24h?.toLocaleString() ?? "—"} subtitle="GPS pings" icon={<Activity size={17} />} accent="amber" />
      </div>

      {/* ETA accuracy bar */}
      {eta && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Target size={15} color="var(--neon)" />
            <span className="section-title">ETA Model Accuracy — Mean Absolute Error</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Heuristic Algorithm", val: eta.heuristic_mae, color: "var(--amber)" },
              { label: "ML Model (RandomForest)", val: eta.ml_mae, color: "var(--neon)" },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.color, fontFamily: "var(--font-mono)" }}>{m.val}s</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "var(--bg-4)" }}>
                  <div style={{ height: "100%", width: `${Math.min((m.val / 300) * 100, 100)}%`, background: m.color, borderRadius: 99, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {assignments && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Assignments — Last 7 Days</p>
            <AssignmentsChart data={assignments} />
          </div>
        )}
        {telemetry && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Telemetry Volume — Last 24h</p>
            <TelemetryChart data={telemetry} />
          </div>
        )}
        {occupancy && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Occupancy Distribution</p>
            <OccupancyChart data={occupancy} />
          </div>
        )}
        {routeUsage && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Route Usage — Last 30 Days</p>
            <RouteUsageChart data={routeUsage} />
          </div>
        )}
      </div>
    </div>
  );
}
