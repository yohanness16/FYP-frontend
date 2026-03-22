"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import { DashboardSummary, ChartData, ETAAccuracy } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { PageLoader } from "@/components/ui/Spinner";
import { AssignmentsChart } from "@/components/charts/AssignmentsChart";
import { OccupancyChart } from "@/components/charts/OccupancyChart";
import { TelemetryChart } from "@/components/charts/TelemetryChart";
import { RouteUsageChart } from "@/components/charts/RouteUsageChart";

const RadioIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const BusIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>;
const RouteIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>;
const UsersIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ActivityIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const RefreshIcon= ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const TargetIcon = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>Fleet Overview</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
            Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary">
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active Trips"       value={summary?.active_assignments ?? "—"} subtitle="Live now"          icon={<RadioIcon />}   accent="green"  />
        <StatCard title="Vehicles"           value={summary?.vehicles ?? "—"}           subtitle="Registered"        icon={<BusIcon />}     accent="blue"   />
        <StatCard title="Routes"             value={summary?.routes ?? "—"}             subtitle="Configured"        icon={<RouteIcon />}   accent="purple" />
        <StatCard title="Users"              value={summary?.users ?? "—"}              subtitle="All roles"         icon={<UsersIcon />}   accent="amber"  />
        <StatCard title="Telemetry 24h"      value={summary?.telemetry_last_24h?.toLocaleString() ?? "—"} subtitle="GPS pings" icon={<ActivityIcon />} accent="blue" />
      </div>

      {/* ETA comparison bar */}
      {eta && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TargetIcon />
            <span className="section-title">ETA Model Accuracy (MAE — lower is better)</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label:"Heuristic Algorithm", val:eta.heuristic_mae, color:"var(--warning)" },
              { label:"ML Model (RandomForest)", val:eta.ml_mae, color:"var(--brand)" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs" style={{ color:"var(--text-secondary)" }}>{m.label}</span>
                  <span className="text-xs font-mono font-bold" style={{ color:m.color }}>{m.val}s</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background:"var(--bg-base)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${Math.min((m.val/300)*100,100)}%`, background:m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assignments && <div className="card"><p className="section-title mb-4">Assignments — Last 7 Days</p><AssignmentsChart data={assignments}/></div>}
        {telemetry   && <div className="card"><p className="section-title mb-4">Telemetry Volume — Last 24h</p><TelemetryChart data={telemetry}/></div>}
        {occupancy   && <div className="card"><p className="section-title mb-4">Occupancy Distribution</p><OccupancyChart data={occupancy}/></div>}
        {routeUsage  && <div className="card"><p className="section-title mb-4">Route Usage — Last 30 Days</p><RouteUsageChart data={routeUsage}/></div>}
      </div>
    </div>
  );
}
