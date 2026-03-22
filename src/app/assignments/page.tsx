"use client";
import { useEffect, useState, useCallback } from "react";
import { vehiclesApi, routesApi, assignmentsApi } from "@/lib/api";
import { Vehicle, Route } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";

const RadioIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const BusIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>;
const RouteIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ClockIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const StopIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>;
const TrashIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const RefreshIcon=() => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const InfoIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

interface LiveAssignment {
  id: number;
  driver_id: number;
  vehicle_id: number;
  route_id: number;
  start_time: string;
  status: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<LiveAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [v, r] = await Promise.all([vehiclesApi.list(), routesApi.list()]);
      setVehicles(v.data);
      setRoutes(r.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [load]);

  const handleEnd = async (id: number) => {
    if (!confirm("End this assignment? The driver's trip will be marked as completed.")) return;
    setEndingId(id);
    try {
      await assignmentsApi.end(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch { alert("Failed to end assignment. Check API."); }
    finally { setEndingId(null); }
  };

  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const rMap = Object.fromEntries(routes.map(r => [r.id, r]));

  const elapsed = (start: string) => {
    const diff = Math.floor((Date.now() - new Date(start).getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff/60)}h ${diff%60}m`;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>Live Assignments</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
            Admin view · auto-refreshes every 20s · updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary">
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-4 flex items-start gap-3 border"
        style={{ background:"var(--brand-subtle)", borderColor:"var(--brand-border)" }}>
        <span style={{ color:"var(--brand)", marginTop:1 }}><InfoIcon /></span>
        <div>
          <p className="text-sm font-medium" style={{ color:"var(--brand)" }}>Admin read-only view</p>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-secondary)" }}>
            Drivers start/end their own trips via the mobile app. Admins can monitor live assignments here and force-end a trip if needed.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Active Trips", value: assignments.length, color:"var(--success)", icon:<RadioIcon /> },
          { label:"Vehicles Available", value: vehicles.filter(v=>v.is_active).length, color:"var(--brand)", icon:<BusIcon /> },
          { label:"Routes Configured", value: routes.length, color:"#a78bfa", icon:<RouteIco /> },
        ].map(c => (
          <div key={c.label} className="card-sm">
            <div className="flex items-center gap-2 mb-2" style={{ color:"var(--text-muted)" }}>
              <span style={{ color:c.color }}>{c.icon}</span>
              <span className="text-xs">{c.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color:c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Live table */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed flex flex-col items-center py-16 text-center"
          style={{ borderColor:"var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background:"var(--success-subtle)", color:"var(--success)" }}>
            <RadioIcon />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color:"var(--text-primary)" }}>No active assignments</h3>
          <p className="text-sm max-w-sm" style={{ color:"var(--text-muted)" }}>
            When drivers start trips from the mobile app, they will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>Active Trips</span>
            <span className="badge badge-green">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:"var(--success)" }} />
              {assignments.length} live
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Vehicle</th>
                <th className="table-header text-left">Route</th>
                <th className="table-header text-left">Driver ID</th>
                <th className="table-header text-left">Started</th>
                <th className="table-header text-left">Elapsed</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => {
                const v = vMap[a.vehicle_id];
                const r = rMap[a.route_id];
                return (
                  <tr key={a.id}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span style={{ color:"var(--brand)" }}><BusIcon /></span>
                        <span className="font-medium text-sm">{v?.plate_number ?? `#${a.vehicle_id}`}</span>
                        {v?.bus_type && <span className="badge badge-gray">{v.bus_type}</span>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5" style={{ color:"var(--text-secondary)" }}>
                        <RouteIco />
                        <span className="text-sm">{r ? `${r.route_number} · ${r.name || r.origin || ""}` : `Route #${a.route_id}`}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5" style={{ color:"var(--text-muted)" }}>
                        <UserIcon />
                        <span className="font-mono text-xs">#{a.driver_id}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs" style={{ color:"var(--text-muted)" }}>
                      <div className="flex items-center gap-1"><ClockIcon />{new Date(a.start_time).toLocaleTimeString()}</div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-green">{elapsed(a.start_time)}</span>
                    </td>
                    <td className="table-cell text-right">
                      <button onClick={() => handleEnd(a.id)} disabled={endingId === a.id}
                        className="btn-danger text-xs px-3 py-1.5">
                        {endingId === a.id
                          ? <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                          : <TrashIcon />}
                        Force End
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
