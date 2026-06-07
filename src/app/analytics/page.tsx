"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import { ChartData, DashboardInsights, ETAAccuracy } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.allSettled([
        dashboardApi.assignmentsOverTime(7), dashboardApi.assignmentsOverTime(30),
        dashboardApi.occupancyDistribution(), dashboardApi.telemetryVolume(),
        dashboardApi.routeUsage(7), dashboardApi.routeUsage(30), dashboardApi.etaAccuracy(), dashboardApi.insights(30),
      ]);
      if (res[0].status === "fulfilled") setA7(res[0].value.data);
      if (res[1].status === "fulfilled") setA30(res[1].value.data);
      if (res[2].status === "fulfilled") setOcc(res[2].value.data);
      if (res[3].status === "fulfilled") setTel(res[3].value.data);
      if (res[4].status === "fulfilled") setR7(res[4].value.data);
      if (res[5].status === "fulfilled") setR30(res[5].value.data);
      if (res[6].status === "fulfilled") setEta(res[6].value.data);
      if (res[7].status === "fulfilled") setInsights(res[7].value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <PageLoader />;

  const assignments = period === 7 ? a7 : a30;
  const routeUsage = period === 7 ? r7 : r30;
  const totalTrips = assignments?.data.reduce((s, v) => s + v, 0) ?? 0;
  const mlBetter = eta && eta.ml_mae < eta.heuristic_mae;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">System performance & fleet insights</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-muted border border-border rounded-lg">
            {([7, 14, 30] as const).map(d => (
              <button key={d} onClick={() => setPeriod(d)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === d ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>{d}d</button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* ETA comparison */}
      {eta && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target size={15} className="text-primary" />ETA Model Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Heuristic Algorithm", val: eta.heuristic_mae, color: "text-amber-500", active: !mlBetter, desc: "Haversine + peak multipliers + dwell time" },
                { label: "ML Model (RandomForest)", val: eta.ml_mae, color: "text-primary", active: !!mlBetter, desc: "Trained on real trip history · improves over time" },
              ].map(m => (
                <div key={m.label} className={`rounded-lg p-4 border ${m.active ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: `var(--${m.color === "text-amber-500" ? "warning" : "primary"})` }} />
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                      {m.active && <span className="badge badge-neon text-[9px]">Active</span>}
                    </div>
                    <TrendingUp size={13} className="text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold font-display tracking-tight" style={{ color: m.color === "text-amber-500" ? "var(--warning)" : "var(--primary)" }}>{m.val}s</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Mean Absolute Error</p>
                  <div className="h-1 rounded-full overflow-hidden bg-muted-foreground/20 mt-3">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((m.val / 300) * 100, 100)}%`, background: m.color === "text-amber-500" ? "var(--warning)" : "var(--primary)" }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{m.desc}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Samples", val: eta.sample_count ?? 0, color: "text-sky-500" },
                { label: "ML Win Rate", val: `${eta.ml_win_rate ?? 0}%`, color: "text-emerald-500" },
                { label: "Comparable", val: eta.comparable_count ?? 0, color: "text-violet-500" },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-2.5 bg-muted/30 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>
            {mlBetter && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                <TrendingUp size={14} />ML model is <strong>{(((eta.heuristic_mae - eta.ml_mae) / eta.heuristic_mae) * 100).toFixed(1)}%</strong> more accurate. Enable it in Settings.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: <BarChart3 size={15} />, label: `Total Trips (${period}d)`, val: totalTrips, color: "text-primary" },
          { icon: <BarChart3 size={15} />, label: "Avg/Day", val: Math.round(totalTrips / period * 10) / 10, color: "text-sky-500" },
          { icon: <Target size={15} />, label: "Heuristic MAE", val: `${eta?.heuristic_mae ?? 0}s`, color: "text-amber-500" },
          { icon: <TrendingUp size={15} />, label: "ML MAE", val: `${eta?.ml_mae ?? 0}s`, color: eta && eta.ml_mae < eta.heuristic_mae ? "text-emerald-500" : "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <span className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</span>
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {insights && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Detailed Usage Insights (Last {insights.days} Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg p-3 bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Most Used Route</p>
                <p className="text-xl font-bold text-primary">{insights.top_route?.route_number ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">{insights.top_route?.name ?? "No route name"}</p>
                <p className="text-xs text-foreground/70 mt-1">{insights.top_route?.trips ?? 0} trips</p>
              </div>
              <div className="rounded-lg p-3 bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Most Used Bus</p>
                <p className="text-xl font-bold text-sky-500">{insights.top_vehicle?.plate_number ?? "—"}</p>
                <p className="text-xs text-foreground/70 mt-1">{insights.top_vehicle?.trips ?? 0} assignments</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg p-3 bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Most Active Times and Top Route by Hour</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {insights.top_routes_by_hour.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hourly assignment distribution yet.</p>
                ) : insights.top_routes_by_hour.slice(0, 12).map((item) => (
                  <div key={`${item.hour}-${item.top_route_number}`} className="rounded-lg p-2 border border-border bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">{String(item.hour).padStart(2, "0")}:00</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{item.top_route_number}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.top_route_trips} trips</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assignments && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assignments — Last {period} Days</CardTitle></CardHeader><CardContent><AssignmentsChart data={assignments} /></CardContent></Card>)}
        {routeUsage && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm">Route Usage — Last {period} Days</CardTitle></CardHeader><CardContent><RouteUsageChart data={routeUsage} /></CardContent></Card>)}
        {occ && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm">Occupancy Distribution</CardTitle></CardHeader><CardContent><OccupancyChart data={occ} /></CardContent></Card>)}
        {tel && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm">Telemetry Volume — Last 24h</CardTitle></CardHeader><CardContent><TelemetryChart data={tel} /></CardContent></Card>)}
      </div>
    </div>
  );
}
