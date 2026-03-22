"use client";
import { useEffect, useState, useCallback } from "react";
import { routesApi } from "@/lib/api";
import { Route, Stop, RouteWithStops } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, Column, Action } from "@/components/ui/DataTable";

/* ── SVG icons ─────────────────────────────────────────────────────────── */
const IC = {
  route:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>,
  pin:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  eye:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  close:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  link:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

/* ── Modal wrapper ─────────────────────────────────────────────────────── */
function Modal({ title, icon, onClose, children }: { title:string; icon:React.ReactNode; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)" }}>
      <div className="anim-up" style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:16, padding:"1.5rem", width:"100%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-brand)" }}>{icon}</div>
            <h3 style={{ fontSize:15, fontWeight:600, color:"var(--c-text)" }}>{title}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding:6 }}>{IC.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function Err({ msg }: { msg:string }) {
  return msg ? <p style={{ fontSize:12, padding:"8px 12px", borderRadius:8, background:"var(--c-red-sub)", color:"var(--c-red)", border:"1px solid var(--c-red-bdr)" }}>{msg}</p> : null;
}

function Btns({ onCancel, saving, label }: { onCancel:()=>void; saving:boolean; label:string }) {
  return (
    <div style={{ display:"flex", gap:10, paddingTop:4 }}>
      <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex:1, justifyContent:"center" }}>Cancel</button>
      <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:"center" }}>
        {saving ? <span style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite" }}/> : label}
      </button>
    </div>
  );
}

/* ── Route modal ───────────────────────────────────────────────────────── */
function RouteModal({ onClose, onSaved }: { onClose:()=>void; onSaved:()=>void }) {
  const [f, setF] = useState({ route_number:"", name:"", origin:"", destination:"" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await routesApi.create(f); onSaved(); onClose(); }
    catch(x:unknown){ setErr((x as {response?:{data?:{detail?:string}}})?.response?.data?.detail||"Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="New Route" icon={IC.route} onClose={onClose}>
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Route Number *"><input className="input" placeholder="e.g. 121" value={f.route_number} onChange={e=>setF(p=>({...p,route_number:e.target.value}))} required /></Field>
        <Field label="Name"><input className="input" placeholder="Megenagna – Mexico" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} /></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Origin"><input className="input" placeholder="Start terminal" value={f.origin} onChange={e=>setF(p=>({...p,origin:e.target.value}))} /></Field>
          <Field label="Destination"><input className="input" placeholder="End terminal" value={f.destination} onChange={e=>setF(p=>({...p,destination:e.target.value}))} /></Field>
        </div>
        <Err msg={err} />
        <Btns onCancel={onClose} saving={busy} label="Create Route" />
      </form>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  );
}

/* ── Stop modal ────────────────────────────────────────────────────────── */
function StopModal({ onClose, onSaved }: { onClose:()=>void; onSaved:()=>void }) {
  const [f, setF] = useState({ name:"", lat:"", lon:"", base_dwell_time:"30", is_terminal:false, peak_multiplier:"1.5" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await routesApi.createStop({ name:f.name, lat:parseFloat(f.lat), lon:parseFloat(f.lon), base_dwell_time:parseInt(f.base_dwell_time), is_terminal:f.is_terminal, peak_multiplier:parseFloat(f.peak_multiplier) }); onSaved(); onClose(); }
    catch(x:unknown){ setErr((x as {response?:{data?:{detail?:string}}})?.response?.data?.detail||"Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="New Stop" icon={IC.pin} onClose={onClose}>
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Stop Name *"><input className="input" placeholder="e.g. Megenagna" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} required /></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Latitude *"><input className="input" style={{ fontFamily:"JetBrains Mono,monospace" }} placeholder="9.0320" type="number" step="any" value={f.lat} onChange={e=>setF(p=>({...p,lat:e.target.value}))} required /></Field>
          <Field label="Longitude *"><input className="input" style={{ fontFamily:"JetBrains Mono,monospace" }} placeholder="38.7520" type="number" step="any" value={f.lon} onChange={e=>setF(p=>({...p,lon:e.target.value}))} required /></Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Dwell Time (s)"><input className="input" type="number" value={f.base_dwell_time} onChange={e=>setF(p=>({...p,base_dwell_time:e.target.value}))} /></Field>
          <Field label="Peak Multiplier"><input className="input" type="number" step="0.1" value={f.peak_multiplier} onChange={e=>setF(p=>({...p,peak_multiplier:e.target.value}))} /></Field>
        </div>
        <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13.5, color:"var(--c-text2)", cursor:"pointer" }}>
          <input type="checkbox" checked={f.is_terminal} onChange={e=>setF(p=>({...p,is_terminal:e.target.checked}))} /> Terminal station
        </label>
        <Err msg={err} />
        <Btns onCancel={onClose} saving={busy} label="Add Stop" />
      </form>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  );
}

/* ── Insert-stop-into-route modal ──────────────────────────────────────── */
function InsertStopModal({ route, stops, onClose, onSaved }: { route:Route; stops:Stop[]; onClose:()=>void; onSaved:()=>void }) {
  const [stopId, setStopId] = useState("");
  const [order,  setOrder]  = useState("1");
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await routesApi.create({
        route_number: route.route_number,
        name: route.name||undefined,
        origin: route.origin||undefined,
        destination: route.destination||undefined,
        stops: [{ stop_id: parseInt(stopId), sequence_order: parseInt(order) }],
      });
      onSaved(); onClose();
    }
    catch(x:unknown){ setErr((x as {response?:{data?:{detail?:string}}})?.response?.data?.detail||"Failed to insert stop"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Insert Stop into Route" icon={IC.link} onClose={onClose}>
      {/* Route info strip */}
      <div style={{ marginBottom:16, padding:"10px 12px", borderRadius:8, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-brand)", fontWeight:700, fontSize:12 }}>{route.route_number}</div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:"var(--c-brand)" }}>{route.name||`Route ${route.route_number}`}</p>
            {route.origin && <p style={{ fontSize:11, color:"var(--c-text2)" }}>{route.origin} → {route.destination}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Select Stop *">
          <select className="input" value={stopId} onChange={e=>setStopId(e.target.value)} required>
            <option value="">Choose a stop…</option>
            {stops.map(s=><option key={s.id} value={s.id}>{s.name} ({s.lat.toFixed(4)}, {s.lon.toFixed(4)})</option>)}
          </select>
        </Field>
        <Field label="Sequence Order *">
          <input className="input" type="number" min="1" placeholder="Position (1 = first stop)" value={order} onChange={e=>setOrder(e.target.value)} required />
          <p style={{ fontSize:11, color:"var(--c-muted)", marginTop:4 }}>Set where this stop falls in the route sequence. Lower numbers = earlier in route.</p>
        </Field>
        <Err msg={err} />
        <Btns onCancel={onClose} saving={busy} label="Insert Stop" />
      </form>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  );
}

/* ── Route detail slide-over panel ─────────────────────────────────────── */
function RoutePanel({ route, stops, onClose, onInsert }: { route:RouteWithStops; stops:Stop[]; onClose:()=>void; onInsert:()=>void }) {
  return (
    <>
      {/* Backdrop */}
      <div style={{ position:"fixed", inset:0, zIndex:35, background:"rgba(0,0,0,0.3)" }} onClick={onClose} />
      {/* Panel */}
      <div className="anim-right" style={{ position:"fixed", top:0, right:0, bottom:0, zIndex:40, width:380, background:"var(--c-card)", borderLeft:"1px solid var(--c-border)", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-brand)", fontWeight:700, fontSize:13 }}>{route.route_number}</div>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:"var(--c-text)" }}>{route.name||`Route ${route.route_number}`}</p>
              {route.origin && <p style={{ fontSize:11.5, color:"var(--c-muted)" }}>{route.origin} → {route.destination}</p>}
            </div>
          </div>
          <button className="btn-ghost" style={{ padding:6 }} onClick={onClose}>{IC.close}</button>
        </div>

        {/* Stops section header */}
        <div style={{ padding:"14px 20px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--c-border)" }}>
          <span style={{ fontWeight:600, fontSize:13.5, color:"var(--c-text)" }}>
            Stops <span style={{ color:"var(--c-muted)", fontWeight:400 }}>({route.stops?.length ?? 0})</span>
          </span>
          <button onClick={onInsert} className="btn-primary" style={{ padding:"5px 12px", fontSize:12 }}>
            {IC.plus} Insert Stop
          </button>
        </div>

        {/* Stops list */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 20px" }}>
          {(!route.stops || route.stops.length === 0) ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--c-muted)" }}>
              <div style={{ marginBottom:8, opacity:0.4 }}>{IC.pin}</div>
              <p style={{ fontSize:13 }}>No stops assigned yet</p>
              <p style={{ fontSize:12, marginTop:4 }}>Click "Insert Stop" above</p>
            </div>
          ) : (
            <div style={{ position:"relative" }}>
              {/* Timeline vertical line */}
              <div style={{ position:"absolute", left:11, top:12, bottom:12, width:2, background:"var(--c-border)" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {route.stops.map((stop, i) => (
                  <div key={stop.id} style={{ display:"flex", gap:12, alignItems:"flex-start", position:"relative" }}>
                    {/* Dot */}
                    <div style={{
                      width:24, height:24, borderRadius:"50%", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:700, zIndex:1,
                      background: i===0||i===route.stops.length-1 ? "var(--c-brand)" : "var(--c-hover)",
                      color: i===0||i===route.stops.length-1 ? "#fff" : "var(--c-text2)",
                      border: `2px solid var(--c-card)`,
                    }}>
                      {i+1}
                    </div>
                    {/* Stop card */}
                    <div style={{ flex:1, background:"var(--c-bg)", border:"1px solid var(--c-border)", borderRadius:8, padding:"9px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"var(--c-text)" }}>{stop.name}</p>
                        {stop.is_terminal && <span className="badge badge-blue" style={{ fontSize:10 }}>Terminal</span>}
                      </div>
                      <div style={{ display:"flex", gap:12, fontSize:11.5, color:"var(--c-muted)" }}>
                        <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}</span>
                        <span>Dwell {stop.base_dwell_time}s</span>
                        <span>Peak ×{stop.peak_multiplier}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function RoutesPage() {
  const [routes,  setRoutes]  = useState<Route[]>([]);
  const [stops,   setStops]   = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"routes"|"stops">("routes");

  const [showRoute,  setShowRoute]  = useState(false);
  const [showStop,   setShowStop]   = useState(false);
  const [panel,      setPanel]      = useState<RouteWithStops|null>(null);
  const [insertFor,  setInsertFor]  = useState<Route|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [r,s] = await Promise.all([routesApi.list(), routesApi.listStops()]); setRoutes(r.data); setStops(s.data); }
    finally { setLoading(false); }
  }, []);

  const openDetail = async (route: Route) => {
    try { const r = await routesApi.get(route.id); setPanel(r.data); }
    catch { setPanel({ ...route, stops: [] } as RouteWithStops); }
  };

  useEffect(() => { load(); }, [load]);
  if (loading) return <PageLoader />;

  /* Route columns */
  const routeCols: Column<Route>[] = [
    { key:"route_number", header:"Route #", sortable:true, width:"100px",
      render: r => (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-brand)", fontWeight:700, fontSize:12 }}>{r.route_number}</div>
        </div>
      ),
    },
    { key:"name", header:"Name", sortable:true,
      render: r => <span style={{ fontWeight:500 }}>{r.name || <span style={{ color:"var(--c-muted)" }}>—</span>}</span>,
    },
    { key:"origin", header:"Origin → Destination", sortable:true,
      render: r => r.origin ? (
        <span style={{ display:"flex", alignItems:"center", gap:6, color:"var(--c-text2)", fontSize:13 }}>
          {r.origin} {IC.arrow} {r.destination||"?"}
        </span>
      ) : <span style={{ color:"var(--c-muted)" }}>—</span>,
    },
    { key:"id", header:"ID", align:"right", sortable:true,
      render: r => <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, color:"var(--c-muted)" }}>#{r.id}</span>,
    },
  ];

  const routeActions: Action<Route>[] = [
    { label:"View Stops", icon: IC.eye, onClick: r => openDetail(r) },
    { label:"Insert Stop", icon: IC.link, onClick: r => setInsertFor(r) },
  ];

  /* Stop columns */
  const stopCols: Column<Stop>[] = [
    { key:"name", header:"Name", sortable:true,
      render: s => <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ color:"var(--c-green)" }}>{IC.pin}</span><span style={{ fontWeight:500 }}>{s.name}</span></div>,
    },
    { key:"lat", header:"Coordinates",
      render: s => <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, color:"var(--c-text2)" }}>{s.lat.toFixed(4)}, {s.lon.toFixed(4)}</span>,
    },
    { key:"base_dwell_time", header:"Dwell", sortable:true, align:"center",
      render: s => <span>{s.base_dwell_time}s</span>,
    },
    { key:"peak_multiplier", header:"Peak ×", sortable:true, align:"center",
      render: s => <span>{s.peak_multiplier}×</span>,
    },
    { key:"is_terminal", header:"Terminal", align:"center",
      render: s => s.is_terminal ? <span className="badge badge-blue">Terminal</span> : <span style={{ color:"var(--c-muted)" }}>—</span>,
    },
  ];

  return (
    <div className="anim-fade">
      {showRoute  && <RouteModal onClose={()=>setShowRoute(false)} onSaved={load} />}
      {showStop   && <StopModal  onClose={()=>setShowStop(false)}  onSaved={load} />}
      {insertFor  && <InsertStopModal route={insertFor} stops={stops} onClose={()=>setInsertFor(null)} onSaved={load} />}
      {panel      && <RoutePanel route={panel} stops={stops} onClose={()=>setPanel(null)} onInsert={()=>{ setInsertFor(panel); setPanel(null); }} />}

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {/* Tabs + refresh */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:3, padding:4, background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:10 }}>
            {([["routes","Routes",routes.length],["stops","Stops",stops.length]] as const).map(([k,lbl,cnt])=>(
              <button key={k} onClick={()=>setTab(k as "routes"|"stops")}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", borderRadius:7, fontSize:13.5, fontWeight:500, border:"none", cursor:"pointer", transition:"all 0.15s",
                  background: tab===k?"var(--c-brand)":"transparent",
                  color: tab===k?"#fff":"var(--c-text2)",
                }}>
                {lbl}
                <span style={{ padding:"1px 7px", borderRadius:12, fontSize:11, fontWeight:600, background: tab===k?"rgba(255,255,255,0.2)":"var(--c-hover)", color: tab===k?"#fff":"var(--c-muted)" }}>{cnt}</span>
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={load} style={{ gap:6 }}>{IC.refresh}</button>
        </div>

        {tab === "routes" ? (
          <DataTable<Route>
            data={routes}
            columns={routeCols}
            actions={routeActions}
            title="Routes"
            subtitle={`${routes.length} configured routes`}
            onAdd={() => setShowRoute(true)}
            addLabel="New Route"
            searchPlaceholder="Search route number, name, origin…"
            emptyMessage="No routes configured yet"
            emptyIcon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>}
          />
        ) : (
          <DataTable<Stop>
            data={stops as unknown as Stop[]}
            columns={stopCols as unknown as Column<Stop>[]}
            title="Bus Stops"
            subtitle={`${stops.length} stops registered`}
            onAdd={() => setShowStop(true)}
            addLabel="Add Stop"
            searchPlaceholder="Search stop name…"
            emptyMessage="No stops added yet"
          />
        )}
      </div>
    </div>
  );
}
