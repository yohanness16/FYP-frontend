"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi, pairingApi, routesApi, vehiclesApi } from "@/lib/api";
import { Route, Vehicle } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, ColDef, TableAction } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle, Bus, CheckCircle, Eye, EyeOff, MapPinned, Plus, RefreshCw,
  Route as RouteIcon, Shield, KeyRound, Truck, Unlink, XCircle,
} from "lucide-react";

/* ── Modals ── */

function VehicleModal({ vehicle, routes, onClose, onSaved }: { vehicle: Vehicle; routes: Route[]; onClose: () => void; onSaved: () => void }) {
  const [routeId, setRouteId] = useState<string>(vehicle.route_id != null ? String(vehicle.route_id) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setRouteId(vehicle.route_id != null ? String(vehicle.route_id) : ""); }, [vehicle]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const rid = routeId === "" ? null : Number(routeId);
      await vehiclesApi.update(vehicle.id, { route_id: rid });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to update vehicle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPinned size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Assign Route</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{vehicle.plate_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
            <Bus size={15} className="text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{vehicle.plate_number}</p>
              <p className="text-xs text-muted-foreground">{vehicle.route_number || (vehicle.route_id ? `Route #${vehicle.route_id}` : "Unassigned")}</p>
            </div>
          </div>
          <div>
            <label className="label">Route assignment</label>
            <select className="input" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">Clear route assignment</option>
              {routes.map((route) => (<option key={route.id} value={route.id}>{route.route_number} — {route.name || route.origin || "Route"}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
            <AlertCircle size={14} />This writes to the backend vehicle route validator and unlocks route-aware map filtering.
          </div>
          {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"><AlertCircle size={13} />{error}</div>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
              {busy ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : "Save Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterVehicleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ plate_number: "", device_id: "", bus_type: "", capacity: "", is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeviceId, setShowDeviceId] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await vehiclesApi.create({ plate_number: form.plate_number.trim(), device_id: form.device_id.trim(), bus_type: form.bus_type || undefined, capacity: form.capacity ? Number(form.capacity) : undefined, is_active: form.is_active });
      onSaved(); onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Vehicle registration failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Truck size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Register Vehicle</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Create a backend-managed bus record.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div><label className="label">Plate Number *</label><input className="input" value={form.plate_number} onChange={(e) => setForm((c) => ({ ...c, plate_number: e.target.value }))} required placeholder="AA-3-B1234" /></div>
          <div>
            <label className="label">Device ID *</label>
            <div className="relative">
              <input className="input pr-10" type={showDeviceId ? "text" : "password"} value={form.device_id} onChange={(e) => setForm((c) => ({ ...c, device_id: e.target.value }))} required placeholder="IMEI" />
              <button type="button" onClick={() => setShowDeviceId((c) => !c)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showDeviceId ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bus Type</label><select className="input" value={form.bus_type} onChange={(e) => setForm((c) => ({ ...c, bus_type: e.target.value }))}><option value="">Select…</option>{["Anbessa", "Sheger", "Minibus", "Electric", "Other"].map((t) => (<option key={t} value={t}>{t}</option>))}</select></div>
            <div><label className="label">Capacity</label><input className="input" type="number" min={0} value={form.capacity} onChange={(e) => setForm((c) => ({ ...c, capacity: e.target.value }))} placeholder="60" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((c) => ({ ...c, is_active: e.target.checked }))} className="accent-primary" />Active in fleet
          </label>
          {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"><AlertCircle size={13} />{error}</div>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : "Register"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BusDashboardActivationModal({ vehicle, onClose, onSaved }: { vehicle: Vehicle; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setSaving(true);
    try {
      await authApi.busDashboardSetup(vehicle.id, password);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to configure dashboard credentials");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center dark:bg-amber-950/30 dark:border-amber-800">
              <Shield size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Activate Bus Dashboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{vehicle.plate_number} ({vehicle.device_id})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="label">Dashboard Password *</label>
            <div className="relative">
              <input className="input pr-10" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPw((c) => !c)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
          <div>
            <label className="label">Confirm Password *</label>
            <div className="relative">
              <input className="input pr-10" type={showCpw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required placeholder="Repeat password" />
              <button type="button" onClick={() => setShowCpw((c) => !c)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showCpw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
            <AlertCircle size={14} />This password is used only to unlock this bus dashboard before driver login.
          </div>
          {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"><AlertCircle size={13} />{error}</div>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : "Activate"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PairingCodeModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; expires_in_seconds: number; message?: string } | null>(null);

  useEffect(() => {
    let cancelled = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await pairingApi.generateCode(vehicle.id);
        if (!cancelled) setResult(res.data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setError(msg || "Failed to generate pairing code");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vehicle.id]);

  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 420 }}>
        <div className="flex justify-between mb-3">
          <div>
            <h3 className="section-title">Pairing Code</h3>
            <p className="text-xs text-muted-foreground mt-1">{vehicle.plate_number} · enter on bus dashboard device</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        {loading && <p className="text-xs text-muted-foreground">Generating code…</p>}
        {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"><AlertCircle size={13} />{error}</div>}
        {result && (
          <div className="text-center py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">One-time code</p>
            <p className="font-mono text-3xl font-extrabold text-primary tracking-[0.2em] mt-2">{result.code}</p>
            <p className="text-xs text-muted-foreground mt-2">Expires in {Math.round(result.expires_in_seconds / 60)} minutes</p>
            {result.message && <p className="text-xs text-foreground/70 mt-2">{result.message}</p>}
          </div>
        )}
        <button type="button" onClick={onClose} className="btn-secondary w-full justify-center mt-3">Close</button>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [assigningVehicle, setAssigningVehicle] = useState<Vehicle | null>(null);
  const [configuringVehicle, setConfiguringVehicle] = useState<Vehicle | null>(null);
  const [pairingVehicle, setPairingVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vr, rr] = await Promise.all([vehiclesApi.list(), routesApi.list()]);
      setVehicles(Array.isArray(vr.data) ? vr.data : []);
      setRoutes(Array.isArray(rr.data) ? rr.data : []);
    } catch (error) { console.error("Failed to load vehicles:", error); setVehicles([]); setRoutes([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredVehicles = useMemo(() => vehicles.filter((v) => filter === "all" || (filter === "active" ? v.is_active : !v.is_active)), [vehicles, filter]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((v) => v.is_active).length,
    inactive: vehicles.filter((v) => !v.is_active).length,
    assigned: vehicles.filter((v) => v.route_id != null).length,
  }), [vehicles]);

  const handleUnpair = async (vehicle: Vehicle) => {
    if (!window.confirm(`Unpair bus dashboard for ${vehicle.plate_number}?`)) return;
    try {
      await pairingApi.unpair(vehicle.id);
      void load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || "Failed to unpair vehicle");
    }
  };

  const actions: TableAction<Vehicle>[] = [
    { label: "Generate Pairing Code", icon: <KeyRound size={13} />, onClick: (row) => setPairingVehicle(row) },
    { label: "Activate Dashboard", icon: <Shield size={13} />, onClick: (row) => setConfiguringVehicle(row) },
    { label: "Unpair Dashboard", icon: <Unlink size={13} />, onClick: (row) => void handleUnpair(row) },
    { label: "Assign Route", icon: <MapPinned size={13} />, onClick: (row) => setAssigningVehicle(row) },
  ];

  const columns: ColDef<Vehicle>[] = [
    {
      key: "plate_number", label: "Vehicle", sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"><Bus size={15} className="text-primary" /></div>
          <div>
            <div className="font-mono font-bold text-sm">{v.plate_number}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{v.device_id}</div>
          </div>
        </div>
      ),
    },
    { key: "bus_type", label: "Type", render: (v) => v.bus_type ? <span className="badge badge-blue">{v.bus_type}</span> : <span className="text-muted-foreground">—</span> },
    { key: "capacity", label: "Capacity", align: "center", render: (v) => v.capacity != null ? <span className="text-sm text-foreground/70">{v.capacity} seats</span> : <span className="text-muted-foreground">—</span> },
    {
      key: "route_id", label: "Route",
      render: (v) => {
        const route = routes.find((r) => r.id === v.route_id);
        return route ? (
          <span className="badge badge-cyan"><RouteIcon size={10} />{route.route_number}</span>
        ) : (<span className="text-muted-foreground">Unassigned</span>);
      },
    },
    { key: "is_active", label: "Status", align: "center", render: (v) => v.is_active ? <span className="badge badge-green"><CheckCircle size={10} />Active</span> : <span className="badge badge-gray"><XCircle size={10} />Inactive</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      {showAdd && <RegisterVehicleModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {assigningVehicle && <VehicleModal vehicle={assigningVehicle} routes={routes} onClose={() => setAssigningVehicle(null)} onSaved={load} />}
      {configuringVehicle && <BusDashboardActivationModal vehicle={configuringVehicle} onClose={() => setConfiguringVehicle(null)} onSaved={load} />}
      {pairingVehicle && <PairingCodeModal vehicle={pairingVehicle} onClose={() => setPairingVehicle(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Vehicles</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Fleet registry synced to the FastAPI backend</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRefreshing(true); void load(); }} className="btn-secondary" disabled={refreshing}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} />Register Vehicle</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", val: stats.total, color: "text-foreground", icon: <Bus size={15} /> },
          { label: "Active", val: stats.active, color: "text-emerald-500", icon: <CheckCircle size={15} /> },
          { label: "Inactive", val: stats.inactive, color: "text-muted-foreground", icon: <XCircle size={15} /> },
          { label: "Assigned", val: stats.assigned, color: "text-primary", icon: <MapPinned size={15} /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</span>
                <span className={s.color}>{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted border border-border rounded-lg w-fit">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <DataTable<Vehicle> data={filteredVehicles} columns={columns} actions={actions} searchPlaceholder="Search plate, device ID, bus type…" searchKeys={["plate_number", "device_id", "bus_type"]} emptyMessage="No vehicles registered" pageSize={10} toolbar={<button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-3 py-1.5"><Plus size={13} />Add</button>} />
    </div>
  );
}
