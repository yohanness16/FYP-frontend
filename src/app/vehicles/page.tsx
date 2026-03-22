"use client";
import { useEffect, useState, useCallback } from "react";
import { vehiclesApi } from "@/lib/api";
import { Vehicle } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, Column } from "@/components/ui/DataTable";

const Plus    = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const Refresh = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const Bus     = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>;
const Check   = ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Eye     = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff  = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

function AddModal({ onClose, onSaved }: { onClose:()=>void; onSaved:()=>void }) {
  const [f, setF] = useState({ plate_number:"", device_id:"", bus_type:"", capacity:"", is_active:true });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await vehiclesApi.create({ plate_number:f.plate_number, device_id:f.device_id, bus_type:f.bus_type||undefined, capacity:f.capacity?Number(f.capacity):undefined, is_active:f.is_active }); onSaved(); onClose(); }
    catch(ex:unknown){ setErr((ex as {response?:{data?:{detail?:string}}})?.response?.data?.detail||"Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}>
      <div className="rounded-2xl w-full max-w-md animate-slide-up" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", padding:"1.5rem", boxShadow:"var(--shadow-lg)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2" style={{ color:"var(--brand)" }}><Bus/><h3 className="text-base font-semibold" style={{ color:"var(--text-primary)" }}>Register Vehicle</h3></div>
          <button onClick={onClose} style={{ color:"var(--text-muted)", fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Plate Number *</label><input className="input" placeholder="e.g. 3-B12345" value={f.plate_number} onChange={e=>setF(p=>({...p,plate_number:e.target.value}))} required /></div>
          <div><label className="label">Device ID (SIM7600 IMEI) *</label><input className="input" style={{ fontFamily:"var(--font-mono)" }} placeholder="IMEI number" value={f.device_id} onChange={e=>setF(p=>({...p,device_id:e.target.value}))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bus Type</label>
              <select className="input" value={f.bus_type} onChange={e=>setF(p=>({...p,bus_type:e.target.value}))}>
                <option value="">Select…</option>
                {["Anbessa","Sheger","Minibus","Other"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Capacity</label><input className="input" type="number" placeholder="60" value={f.capacity} onChange={e=>setF(p=>({...p,capacity:e.target.value}))} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color:"var(--text-secondary)" }}>
            <input type="checkbox" checked={f.is_active} onChange={e=>setF(p=>({...p,is_active:e.target.checked}))} style={{ accentColor:"var(--brand)" }} />
            Active (available for assignments)
          </label>
          {err && <p className="text-xs px-3 py-2 rounded-lg" style={{ background:"var(--danger-subtle)", color:"var(--danger)" }}>{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">{busy?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:"Register"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all");

  const load = useCallback(async () => { setLoading(true); try { const r = await vehiclesApi.list(); setVehicles(r.data); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter(v => statusFilter==="all"||(statusFilter==="active"?v.is_active:!v.is_active));

  const cols: Column<Vehicle>[] = [
    {
      key:"plate_number", label:"Vehicle", getValue: v=>v.plate_number,
      render: v => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:"var(--brand-subtle)", border:"1px solid var(--brand-border)", color:"var(--brand)" }}><Bus/></div>
          <span className="font-mono font-semibold">{v.plate_number}</span>
        </div>
      )
    },
    { key:"device_id", label:"Device ID (IMEI)", getValue: v=>v.device_id,
      render: v=><span className="font-mono text-xs" style={{ color:"var(--text-secondary)" }}>{v.device_id}</span> },
    { key:"bus_type",  label:"Type",     getValue: v=>v.bus_type||"",
      render: v=>v.bus_type?<span className="badge badge-gray">{v.bus_type}</span>:<span style={{ color:"var(--text-muted)" }}>—</span> },
    { key:"capacity",  label:"Capacity", getValue: v=>v.capacity??0,
      render: v=>v.capacity?<span style={{ color:"var(--text-secondary)" }}>{v.capacity} seats</span>:<span style={{ color:"var(--text-muted)" }}>—</span> },
    { key:"is_active", label:"Status",   sortable:false,
      render: v=>v.is_active
        ?<span className="badge badge-green"><Check/>Active</span>
        :<span className="badge badge-gray">Inactive</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onSaved={load} />}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>Vehicles</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{vehicles.length} buses registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><Refresh /></button>
          <button onClick={()=>setShowAdd(true)} className="btn-primary"><Plus />Register Vehicle</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Total",    val:vehicles.length,                        color:"var(--text-primary)" },
          { label:"Active",   val:vehicles.filter(v=>v.is_active).length, color:"var(--success)"      },
          { label:"Inactive", val:vehicles.filter(v=>!v.is_active).length,color:"var(--text-muted)"   },
        ].map(s => (
          <div key={s.label} className="card-sm text-center">
            <p className="text-2xl font-bold" style={{ color:s.color }}>{s.val}</p>
            <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter + DataTable */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
        {(["all","active","inactive"] as const).map(f=>(
          <button key={f} onClick={()=>setStatusFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={statusFilter===f?{background:"var(--brand)",color:"#fff"}:{color:"var(--text-muted)"}}>
            {f}
          </button>
        ))}
      </div>

      <DataTable<Vehicle>
        data={filtered}
        columns={cols}
        searchKeys={["plate_number","device_id","bus_type"]}
        title="Fleet Registry"
        pageSize={10}
        emptyText="No vehicles registered yet"
        toolbar={
          <button onClick={()=>setShowAdd(true)} className="btn-primary" style={{ padding:"6px 12px" }}>
            <Plus/>Add
          </button>
        }
      />
    </div>
  );
}
