"use client";
import { useEffect, useState, useCallback } from "react";
import { vehiclesApi, routesApi, assignmentsApi } from "@/lib/api";
import { Vehicle, Route } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Radio, Bus, Route as RouteIcon, User, Clock, Trash2, RefreshCw, Info } from "lucide-react";

interface LiveAssignment { id: number; driver_id: number; vehicle_id: number; route_id: number; start_time: string; status: string; }

export default function AssignmentsPage() {
  const [assignments] = useState<LiveAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [v, r] = await Promise.all([vehiclesApi.list(), routesApi.list()]);
      setVehicles(v.data); setRoutes(r.data);
      setLastUpdated(new Date());
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(() => load(true), 20000); return () => clearInterval(t); }, [load]);

  const handleEnd = async (id: number) => {
    if (!confirm("End this assignment?")) return;
    setEndingId(id);
    try { await assignmentsApi.end(id); }
    catch { alert("Failed to end assignment."); }
    finally { setEndingId(null); }
  };

  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const rMap = Object.fromEntries(routes.map(r => [r.id, r]));
  const elapsed = (start: string) => { const diff = Math.floor((Date.now() - new Date(start).getTime()) / 60000); return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`; };

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Live Assignments</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Admin view · refreshes every 20s · {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary">
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />Refresh
        </button>
      </div>

      {/* Info */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)" }}>
        <Info size={14} color="var(--neon)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--neon)" }}>Admin read-only view</p>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Drivers start/end trips via the mobile app. Admins can monitor and force-end trips here.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Active Trips", value: assignments.length, color: "var(--green)", icon: <Radio size={15} /> },
          { label: "Active Vehicles", value: vehicles.filter(v => v.is_active).length, color: "var(--neon)", icon: <Bus size={15} /> },
          { label: "Routes", value: routes.length, color: "var(--cyan)", icon: <RouteIcon size={15} /> },
        ].map(c => (
          <div key={c.label} className="card-sm">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span style={{ color: c.color }}>{c.icon}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: c.color, fontFamily: "var(--font-display)" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid var(--green-border)" }}>
            <Radio size={22} color="var(--green)" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No active assignments</h3>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>When drivers start trips from the mobile app, they will appear here in real time.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Active Trips</span>
            <span className="badge badge-green"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />{assignments.length} live</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr className="tbl-head">
              <th className="tbl-th">Vehicle</th><th className="tbl-th">Route</th>
              <th className="tbl-th">Driver</th><th className="tbl-th">Started</th>
              <th className="tbl-th">Elapsed</th><th className="tbl-th" style={{ textAlign: "right" }}>Action</th>
            </tr></thead>
            <tbody>
              {assignments.map(a => {
                const v = vMap[a.vehicle_id]; const r = rMap[a.route_id];
                return (
                  <tr key={a.id} className="tbl-row">
                    <td className="tbl-td"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bus size={14} color="var(--neon)" /><span style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 13 }}>{v?.plate_number ?? `#${a.vehicle_id}`}</span></div></td>
                    <td className="tbl-td"><div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-2)", fontSize: 13 }}><RouteIcon size={13} />{r ? `${r.route_number} · ${r.name || r.origin || ""}` : `Route #${a.route_id}`}</div></td>
                    <td className="tbl-td"><div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-3)" }}><User size={13} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>#{a.driver_id}</span></div></td>
                    <td className="tbl-td"><div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-3)", fontSize: 12 }}><Clock size={12} />{new Date(a.start_time).toLocaleTimeString()}</div></td>
                    <td className="tbl-td"><span className="badge badge-green">{elapsed(a.start_time)}</span></td>
                    <td className="tbl-td" style={{ textAlign: "right" }}>
                      <button onClick={() => handleEnd(a.id)} disabled={endingId === a.id} className="btn-danger" style={{ fontSize: 12, padding: "5px 10px" }}>
                        {endingId === a.id ? <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--red)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} />}
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
