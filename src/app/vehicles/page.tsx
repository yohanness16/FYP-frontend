"use client";
import { useEffect, useState, useCallback } from "react";
import { vehiclesApi } from "@/lib/api";
import { Vehicle } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, ColDef } from "@/components/ui/DataTable";
import { Bus, CheckCircle, XCircle, RefreshCw, Plus, AlertCircle, Eye, EyeOff } from "lucide-react";

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ plate_number: "", device_id: "", bus_type: "", capacity: "", is_active: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showId, setShowId] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await vehiclesApi.create({ plate_number: f.plate_number, device_id: f.device_id, bus_type: f.bus_type || undefined, capacity: f.capacity ? Number(f.capacity) : undefined, is_active: f.is_active });
      onSaved(); onClose();
    } catch (ex: unknown) { setErr((ex as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
      <div className="anim-up" style={{ background: "var(--bg-2)", border: "1px solid var(--neon-border)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 440, boxShadow: "var(--shadow-neon)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bus size={15} color="var(--neon)" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>Register Vehicle</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label className="label">Plate Number *</label><input className="input" placeholder="e.g. AA-3-B1234" value={f.plate_number} onChange={e => setF(p => ({ ...p, plate_number: e.target.value }))} required /></div>
          <div>
            <label className="label">Device ID (SIM7600 IMEI) *</label>
            <div style={{ position: "relative" }}>
              <input className="input" style={{ paddingRight: 40, fontFamily: "var(--font-mono)" }} type={showId ? "text" : "password"} placeholder="IMEI number" value={f.device_id} onChange={e => setF(p => ({ ...p, device_id: e.target.value }))} required />
              <button type="button" onClick={() => setShowId(s => !s)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                {showId ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="label">Bus Type</label>
              <select className="input" value={f.bus_type} onChange={e => setF(p => ({ ...p, bus_type: e.target.value }))}>
                <option value="">Select…</option>
                {["Anbessa", "Sheger", "Minibus", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Capacity</label><input className="input" type="number" placeholder="60" value={f.capacity} onChange={e => setF(p => ({ ...p, capacity: e.target.value }))} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={f.is_active} onChange={e => setF(p => ({ ...p, is_active: e.target.checked }))} style={{ accentColor: "var(--neon)" }} />
            Active (available for assignments)
          </label>
          {err && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}><AlertCircle size={13} />{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {busy ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : "Register"}
            </button>
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
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const load = useCallback(async () => { setLoading(true); try { const r = await vehiclesApi.list(); setVehicles(r.data); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter(v => filter === "all" || (filter === "active" ? v.is_active : !v.is_active));

  const cols: ColDef<Vehicle>[] = [
    {
      key: "plate_number", label: "Vehicle", sortable: true,
      render: v => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bus size={15} color="var(--neon)" />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>{v.plate_number}</span>
        </div>
      )
    },
    { key: "device_id", label: "Device ID", render: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{v.device_id}</span> },
    { key: "bus_type", label: "Type", render: v => v.bus_type ? <span className="badge badge-cyan">{v.bus_type}</span> : <span style={{ color: "var(--text-4)" }}>—</span> },
    { key: "capacity", label: "Capacity", align: "center", render: v => v.capacity ? <span style={{ color: "var(--text-2)", fontSize: 13 }}>{v.capacity} seats</span> : <span style={{ color: "var(--text-4)" }}>—</span> },
    {
      key: "is_active", label: "Status", align: "center",
      render: v => v.is_active
        ? <span className="badge badge-green"><CheckCircle size={10} />Active</span>
        : <span className="badge badge-gray"><XCircle size={10} />Inactive</span>
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={load} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Vehicles</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{vehicles.length} buses registered</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14} /></button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} />Register Vehicle</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total", val: vehicles.length, color: "var(--text)" },
          { label: "Active", val: vehicles.filter(v => v.is_active).length, color: "var(--green)" },
          { label: "Inactive", val: vehicles.filter(v => !v.is_active).length, color: "var(--text-3)" },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "var(--font-display)" }}>{s.val}</p>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {(["all", "active", "inactive"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: filter === f ? "var(--neon)" : "transparent", color: filter === f ? "#000" : "var(--text-2)" }}>
            {f}
          </button>
        ))}
      </div>

      <DataTable<Vehicle>
        data={filtered as unknown as (Vehicle & Record<string, unknown>)[]}
        columns={cols as ColDef<Vehicle & Record<string, unknown>>[]}
        searchPlaceholder="Search plate, device ID…"
        searchKeys={["plate_number", "device_id", "bus_type"]}
        emptyMessage="No vehicles registered"
        pageSize={10}
        toolbar={<button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: "6px 12px" }}><Plus size={13} />Add</button>}
      />
    </div>
  );
}
