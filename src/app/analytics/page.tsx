"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import { ChartData, ETAAccuracy } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { AssignmentsChart } from "@/components/charts/AssignmentsChart";
import { OccupancyChart } from "@/components/charts/OccupancyChart";
import { TelemetryChart } from "@/components/charts/TelemetryChart";
import { RouteUsageChart } from "@/components/charts/RouteUsageChart";

const RefreshIcon = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const TargetIcon  = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const TrendUpIcon = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const ChartIcon   = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;

export default function AnalyticsPage() {
  const [a7, setA7]   = useState<ChartData|null>(null);
  const [a30, setA30] = useState<ChartData|null>(null);
  const [occ, setOcc] = useState<ChartData|null>(null);
  const [tel, setTel] = useState<ChartData|null>(null);
  const [r7,  setR7]  = useState<ChartData|null>(null);
  const [r30, setR30] = useState<ChartData|null>(null);
  const [eta, setEta] = useState<ETAAccuracy|null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7|14|30>(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.allSettled([
        dashboardApi.assignmentsOverTime(7), dashboardApi.assignmentsOverTime(30),
        dashboardApi.occupancyDistribution(), dashboardApi.telemetryVolume(),
        dashboardApi.routeUsage(7), dashboardApi.routeUsage(30), dashboardApi.etaAccuracy(),
      ]);
      if (res[0].status==="fulfilled") setA7(res[0].value.data);
      if (res[1].status==="fulfilled") setA30(res[1].value.data);
      if (res[2].status==="fulfilled") setOcc(res[2].value.data);
      if (res[3].status==="fulfilled") setTel(res[3].value.data);
      if (res[4].status==="fulfilled") setR7(res[4].value.data);
      if (res[5].status==="fulfilled") setR30(res[5].value.data);
      if (res[6].status==="fulfilled") setEta(res[6].value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <PageLoader />;

  const assignments = period === 7 ? a7 : a30;
  const routeUsage  = period === 7 ? r7 : r30;
  const totalTrips  = assignments?.data.reduce((s,v)=>s+v,0) ?? 0;
  const mlBetter    = eta && eta.ml_mae < eta.heuristic_mae;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>Analytics</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>System performance & fleet insights</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            {([7,14,30] as const).map(d=>(
              <button key={d} onClick={()=>setPeriod(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={period===d?{background:"var(--brand)",color:"#fff"}:{color:"var(--text-muted)"}}>{d}d</button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary"><RefreshIcon /></button>
        </div>
      </div>

      {/* ETA comparison */}
      {eta && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <TargetIcon />
            <span className="section-title">ETA Model Comparison</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label:"Heuristic Algorithm", val:eta.heuristic_mae, color:"var(--warning)", active:!mlBetter, desc:"Haversine + peak multipliers + dwell time" },
              { label:"ML Model (RandomForest)", val:eta.ml_mae, color:"var(--brand)", active:!!mlBetter, desc:"Trained on real trip history · improves over time" },
            ].map(m=>(
              <div key={m.label} className="rounded-xl p-4" style={{ background:"var(--bg-base)", border:`1px solid ${m.active?"var(--brand-border)":"var(--border)"}`, background: m.active?"var(--brand-subtle)":"var(--bg-base)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background:m.color }}/>
                    <span className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{m.label}</span>
                    {m.active && <span className="badge badge-green text-[10px]">Active</span>}
                  </div>
                  <TrendUpIcon />
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color:m.color }}>{m.val}s</p>
                <p className="text-xs mb-3" style={{ color:"var(--text-muted)" }}>Mean Absolute Error</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width:`${Math.min((m.val/300)*100,100)}%`, background:m.color, transition:"width 0.7s ease" }}/>
                </div>
                <p className="text-[11px] mt-2" style={{ color:"var(--text-muted)" }}>{m.desc}</p>
              </div>
            ))}
          </div>
          {mlBetter && (
            <div className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background:"var(--success-subtle)", border:"1px solid rgba(63,185,80,0.2)", color:"var(--success)" }}>
              <TrendUpIcon />
              ML model is <strong>{(((eta.heuristic_mae-eta.ml_mae)/eta.heuristic_mae)*100).toFixed(1)}%</strong> more accurate. Enable it in Settings.
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon:<ChartIcon/>, label:`Total Trips (${period}d)`, val:totalTrips, color:"var(--brand)" },
          { icon:<ChartIcon/>, label:"Avg Trips/Day", val:Math.round(totalTrips/period*10)/10, color:"#a78bfa" },
          { icon:<TargetIcon/>, label:"Heuristic MAE", val:`${eta?.heuristic_mae??0}s`, color:"var(--warning)" },
          { icon:<TrendUpIcon/>, label:"ML Model MAE", val:`${eta?.ml_mae??0}s`, color:"var(--brand)" },
        ].map(s=>(
          <div key={s.label} className="card-sm text-center">
            <span className="flex justify-center mb-2" style={{ color:s.color }}>{s.icon}</span>
            <p className="text-xl font-bold" style={{ color:s.color }}>{s.val}</p>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assignments && <div className="card"><p className="section-title mb-4">Assignments — Last {period} Days</p><AssignmentsChart data={assignments}/></div>}
        {routeUsage  && <div className="card"><p className="section-title mb-4">Route Usage — Last {period} Days</p><RouteUsageChart data={routeUsage}/></div>}
        {occ         && <div className="card"><p className="section-title mb-4">Occupancy Distribution</p><OccupancyChart data={occ}/></div>}
        {tel         && <div className="card"><p className="section-title mb-4">Telemetry Volume — Last 24h</p><TelemetryChart data={tel}/></div>}
      </div>
    </div>
  );
}
