"use client";
import { useEffect, useState, useCallback } from "react";
import { routesApi } from "@/lib/api";
import { Route, Stop } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, ColDef } from "@/components/ui/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Route as RouteIcon, MapPin, Plus, RefreshCw, ArrowRight, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

function RouteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ route_number: "", name: "", origin: "", destination: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await routesApi.create(f); onSaved(); onClose(); }
    catch (x: unknown) { setErr(getErrorMessage(x, "Failed")); }
    finally { setBusy(false); }
  };
  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"><RouteIcon size={15} className="text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground font-display">New Route</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div><label className="label">Route Number *</label><input className="input" placeholder="e.g. 121" value={f.route_number} onChange={e => setF(p => ({ ...p, route_number: e.target.value }))} required /></div>
          <div><label className="label">Name</label><input className="input" placeholder="Megenagna – Mexico" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Origin</label><input className="input" placeholder="Start terminal" value={f.origin} onChange={e => setF(p => ({ ...p, origin: e.target.value }))} /></div>
            <div><label className="label">Destination</label><input className="input" placeholder="End terminal" value={f.destination} onChange={e => setF(p => ({ ...p, destination: e.target.value }))} /></div>
          </div>
          {err && <p className="text-xs p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">{err}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">{busy ? "Saving…" : "Create Route"}</button>
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
    catch (x: unknown) { setErr(getErrorMessage(x, "Failed")); }
    finally { setBusy(false); }
  };
  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center dark:bg-sky-950/30 dark:border-sky-800"><MapPin size={15} className="text-sky-600 dark:text-sky-400" /></div>
            <h3 className="text-sm font-bold text-foreground font-display">Add Stop</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div><label className="label">Stop Name *</label><input className="input" placeholder="e.g. Megenagna" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Latitude *</label><input className="input font-mono" placeholder="9.0320" type="number" step="any" value={f.lat} onChange={e => setF(p => ({ ...p, lat: e.target.value }))} required /></div>
            <div><label className="label">Longitude *</label><input className="input font-mono" placeholder="38.7520" type="number" step="any" value={f.lon} onChange={e => setF(p => ({ ...p, lon: e.target.value }))} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Dwell (s)</label><input className="input" type="number" value={f.base_dwell_time} onChange={e => setF(p => ({ ...p, base_dwell_time: e.target.value }))} /></div>
            <div><label className="label">Peak ×</label><input className="input" type="number" step="0.1" value={f.peak_multiplier} onChange={e => setF(p => ({ ...p, peak_multiplier: e.target.value }))} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" checked={f.is_terminal} onChange={e => setF(p => ({ ...p, is_terminal: e.target.checked }))} className="accent-primary" />Terminal station</label>
          {err && <p className="text-xs p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">{err}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">{busy ? "Saving…" : "Add Stop"}</button>
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
    { key: "route_number", label: "Route #", sortable: true, width: "90px", render: r => <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary font-display">{(r as unknown as Route).route_number}</div> },
    { key: "name", label: "Name", sortable: true, render: r => <span className="font-medium">{(r as unknown as Route).name || <span className="text-muted-foreground">—</span>}</span> },
    { key: "origin", label: "Origin → Destination", sortable: true, render: r => { const rr = r as unknown as Route; return rr.origin ? <span className="flex items-center gap-1.5 text-foreground/70 text-sm">{rr.origin}<ArrowRight size={11} />{rr.destination || "?"}</span> : <span className="text-muted-foreground">—</span>; } },
    { key: "id", label: "ID", align: "right", render: r => <span className="font-mono text-xs text-muted-foreground">#{(r as unknown as Route).id}</span> },
  ];

  const stopCols: ColDef<Stop & Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true, render: s => <div className="flex items-center gap-2"><MapPin size={14} className="text-sky-500" /><span className="font-medium">{(s as unknown as Stop).name}</span></div> },
    { key: "lat", label: "Coordinates", render: s => { const ss = s as unknown as Stop; return <span className="font-mono text-xs text-foreground/70">{ss.lat.toFixed(4)}, {ss.lon.toFixed(4)}</span>; } },
    { key: "base_dwell_time", label: "Dwell", sortable: true, align: "center", render: s => <span>{(s as unknown as Stop).base_dwell_time}s</span> },
    { key: "peak_multiplier", label: "Peak ×", sortable: true, align: "center", render: s => <span>{(s as unknown as Stop).peak_multiplier}×</span> },
    { key: "is_terminal", label: "Terminal", align: "center", render: s => (s as unknown as Stop).is_terminal ? <span className="badge badge-neon">Terminal</span> : <span className="text-muted-foreground">—</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      {showRoute && <RouteModal onClose={() => setShowRoute(false)} onSaved={load} />}
      {showStop && <StopModal onClose={() => setShowStop(false)} onSaved={load} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground font-display">Routes & Stops</h2>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} /></button>
          <button onClick={() => setShowStop(true)} className="btn-secondary"><Plus size={14} />Add Stop</button>
          <button onClick={() => setShowRoute(true)} className="btn-primary"><Plus size={14} />New Route</button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted border border-border rounded-lg w-fit">
        {([["routes", "Routes", routes.length], ["stops", "Stops", stops.length]] as const).map(([k, lbl, cnt]) => (
          <button key={k} onClick={() => setTab(k as "routes" | "stops")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>
            {lbl}<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tab === k ? "bg-white/20" : "bg-muted-foreground/20 text-muted-foreground"}`}>{cnt}</span>
          </button>
        ))}
      </div>

      {tab === "routes" ? (
        <DataTable<Route & Record<string, unknown>> data={routes as unknown as (Route & Record<string, unknown>)[]} columns={routeCols} title="Routes" subtitle={`${routes.length} configured routes`} onAdd={() => setShowRoute(true)} addLabel="New Route" searchPlaceholder="Search route number, name…" emptyMessage="No routes configured yet" />
      ) : (
        <DataTable<Stop & Record<string, unknown>> data={stops as unknown as (Stop & Record<string, unknown>)[]} columns={stopCols} title="Bus Stops" subtitle={`${stops.length} stops registered`} onAdd={() => setShowStop(true)} addLabel="Add Stop" searchPlaceholder="Search stop name…" emptyMessage="No stops added yet" />
      )}
    </div>
  );
}
