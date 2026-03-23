"use client";
import { useEffect, useState, useCallback } from "react";
import { routesApi } from "@/lib/api";
import { Route, Stop } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, ColDef } from "@/components/ui/DataTable";
import { Route as RouteIcon, MapPin, Plus, RefreshCw, ArrowRight } from "lucide-react";

function RouteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ route_number: "", name: "", origin: "", destination: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await routesApi.create(f); onSaved(); onClose(); }
    catch (x: unknown) { setErr((x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
      <div className="anim-up" style={{ background: "var(--bg-2)", border: "1px solid var(--neon-border)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-neon)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--cyan-dim)", border: "1px solid var(--cyan-border)", display: "flex", alignItems: "center", justifyContent: "center" }}><RouteIcon size={15} color="var(--cyan)" /></div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>New Route</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="label">Route Number *</label><input className="input" placeholder="e.g. 121" value={f.route_number} onChange={e => setF(p => ({ ...p, route_number: e.target.value }))} required /></div>
          <div><label className="label">Name</label><input className="input" placeholder="Megenagna – Mexico" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="label">Origin</label><input className="input" placeholder="Start terminal" value={f.origin} onChange={e => setF(p => ({ ...p, origin: e.target.value }))} /></div>
            <div><label className="label">Destination</label><input className="input" placeholder="End terminal" value={f.destination} onChange={e => setF(p => ({ ...p, destination: e.target.value }))} /></div>
          </div>
          {err && <p style={{ fontSize: 12, padding: "8px 12px", borderRadius: 8, background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>{busy ? "Saving…" : "Create Route"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StopModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", lat: "", lon: "", base_dwell_time: "30", is_terminal: false, peak_multiplier: "1.5" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await routesApi.createStop({ name: f.name, lat: parseFloat(f.lat), lon: parseFloat(f.lon), base_dwell_time: parseInt(f.base_dwell_time), is_terminal: f.is_terminal, peak_multiplier: parseFloat(f.peak_multiplier) }); onSaved(); onClose(); }
    catch (x: unknown) { setErr((x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
      <div className="anim-up" style={{ background: "var(--bg-2)", border: "1px solid var(--cyan-border)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420, boxShadow: "0 0 0 1px var(--cyan-border), 0 4px 20px rgba(0,229,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--cyan-dim)", border: "1px solid var(--cyan-border)", display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={15} color="var(--cyan)" /></div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>Add Stop</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="label">Stop Name *</label><input className="input" placeholder="e.g. Megenagna" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="label">Latitude *</label><input className="input" style={{ fontFamily: "var(--font-mono)" }} placeholder="9.0320" type="number" step="any" value={f.lat} onChange={e => setF(p => ({ ...p, lat: e.target.value }))} required /></div>
            <div><label className="label">Longitude *</label><input className="input" style={{ fontFamily: "var(--font-mono)" }} placeholder="38.7520" type="number" step="any" value={f.lon} onChange={e => setF(p => ({ ...p, lon: e.target.value }))} required /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="label">Dwell (s)</label><input className="input" type="number" value={f.base_dwell_time} onChange={e => setF(p => ({ ...p, base_dwell_time: e.target.value }))} /></div>
            <div><label className="label">Peak ×</label><input className="input" type="number" step="0.1" value={f.peak_multiplier} onChange={e => setF(p => ({ ...p, peak_multiplier: e.target.value }))} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={f.is_terminal} onChange={e => setF(p => ({ ...p, is_terminal: e.target.checked }))} style={{ accentColor: "var(--neon)" }} /> Terminal station
          </label>
          {err && <p style={{ fontSize: 12, padding: "8px 12px", borderRadius: 8, background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>{busy ? "Saving…" : "Add Stop"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"routes" | "stops">("routes");
  const [showRoute, setShowRoute] = useState(false);
  const [showStop, setShowStop] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [r, s] = await Promise.all([routesApi.list(), routesApi.listStops()]); setRoutes(r.data); setStops(s.data); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const routeCols: ColDef<Route & Record<string, unknown>>[] = [
    {
      key: "route_number", label: "Route #", sortable: true, width: "90px",
      render: r => <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "var(--neon)", fontFamily: "var(--font-display)" }}>{(r as unknown as Route).route_number}</div>
    },
    { key: "name", label: "Name", sortable: true, render: r => <span style={{ fontWeight: 500 }}>{(r as unknown as Route).name || <span style={{ color: "var(--text-4)" }}>—</span>}</span> },
    {
      key: "origin", label: "Origin → Destination", sortable: true,
      render: r => { const rr = r as unknown as Route; return rr.origin ? <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-2)", fontSize: 13 }}>{rr.origin}<ArrowRight size={11} />{rr.destination || "?"}</span> : <span style={{ color: "var(--text-4)" }}>—</span>; }
    },
    { key: "id", label: "ID", align: "right", render: r => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-4)" }}>#{(r as unknown as Route).id}</span> },
  ];

  const stopCols: ColDef<Stop & Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true, render: s => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={14} color="var(--cyan)" /><span style={{ fontWeight: 500 }}>{(s as unknown as Stop).name}</span></div> },
    { key: "lat", label: "Coordinates", render: s => { const ss = s as unknown as Stop; return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{ss.lat.toFixed(4)}, {ss.lon.toFixed(4)}</span>; } },
    { key: "base_dwell_time", label: "Dwell", sortable: true, align: "center", render: s => <span>{(s as unknown as Stop).base_dwell_time}s</span> },
    { key: "peak_multiplier", label: "Peak ×", sortable: true, align: "center", render: s => <span>{(s as unknown as Stop).peak_multiplier}×</span> },
    { key: "is_terminal", label: "Terminal", align: "center", render: s => (s as unknown as Stop).is_terminal ? <span className="badge badge-neon">Terminal</span> : <span style={{ color: "var(--text-4)" }}>—</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showRoute && <RouteModal onClose={() => setShowRoute(false)} onSaved={load} />}
      {showStop && <StopModal onClose={() => setShowStop(false)} onSaved={load} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Routes & Stops</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} /></button>
          <button onClick={() => setShowStop(true)} className="btn-secondary"><Plus size={14} />Add Stop</button>
          <button onClick={() => setShowRoute(true)} className="btn-primary"><Plus size={14} />New Route</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {([["routes", "Routes", routes.length], ["stops", "Stops", stops.length]] as const).map(([k, lbl, cnt]) => (
          <button key={k} onClick={() => setTab(k as "routes" | "stops")}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", transition: "all 0.15s", background: tab === k ? "var(--neon)" : "transparent", color: tab === k ? "#000" : "var(--text-2)" }}>
            {lbl}
            <span style={{ padding: "1px 7px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: tab === k ? "rgba(0,0,0,0.15)" : "var(--bg-4)", color: tab === k ? "#000" : "var(--text-3)" }}>{cnt}</span>
          </button>
        ))}
      </div>

      {tab === "routes" ? (
        <DataTable<Route & Record<string, unknown>>
          data={routes as unknown as (Route & Record<string, unknown>)[]}
          columns={routeCols}
          title="Routes"
          subtitle={`${routes.length} configured routes`}
          onAdd={() => setShowRoute(true)}
          addLabel="New Route"
          searchPlaceholder="Search route number, name…"
          emptyMessage="No routes configured yet"
        />
      ) : (
        <DataTable<Stop & Record<string, unknown>>
          data={stops as unknown as (Stop & Record<string, unknown>)[]}
          columns={stopCols}
          title="Bus Stops"
          subtitle={`${stops.length} stops registered`}
          onAdd={() => setShowStop(true)}
          addLabel="Add Stop"
          searchPlaceholder="Search stop name…"
          emptyMessage="No stops added yet"
        />
      )}
    </div>
  );
}
