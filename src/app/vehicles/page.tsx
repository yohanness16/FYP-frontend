"use client";

import { useEffect, useMemo, useState } from "react";
import { routesApi, vehiclesApi } from "@/lib/api";
import { Route, Vehicle } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { DataTable, ColDef, TableAction } from "@/components/ui/DataTable";
import {
  AlertCircle,
  Bus,
  CheckCircle,
  Eye,
  EyeOff,
  MapPinned,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Slash,
  Truck,
  XCircle,
} from "lucide-react";

function VehicleModal({
  vehicle,
  routes,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle;
  routes: Route[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [routeId, setRouteId] = useState<string>(vehicle.route_id != null ? String(vehicle.route_id) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRouteId(vehicle.route_id != null ? String(vehicle.route_id) : "");
  }, [vehicle]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await vehiclesApi.update(vehicle.id, {
        route_id: routeId === "" ? null : Number(routeId),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Failed to update vehicle"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div
        className="anim-up"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 18,
          padding: 20,
          background: "var(--bg-2)",
          border: "1px solid var(--cyan-border)",
          boxShadow: "0 0 0 1px var(--cyan-border), 0 16px 48px rgba(0, 229, 255, 0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--cyan-dim)", border: "1px solid var(--cyan-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPinned size={16} color="var(--cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>Assign Route</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{vehicle.plate_number}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <Bus size={15} color="var(--neon)" />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{vehicle.plate_number}</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{vehicle.route_number || (vehicle.route_id ? `Route #${vehicle.route_id}` : "Unassigned")}</p>
            </div>
          </div>

          <div>
            <label className="label">Route assignment</label>
            <select className="input" value={routeId} onChange={(event) => setRouteId(event.target.value)}>
              <option value="">Clear route assignment</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.route_number} — {route.name || route.origin || "Route"}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "var(--amber-dim)", border: "1px solid var(--amber-border)", color: "var(--amber)", fontSize: 12 }}>
            <AlertCircle size={14} />
            This writes to the backend vehicle route validator and unlocks route-aware map filtering.
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {busy ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : "Save Route"}
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
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await vehiclesApi.create({
        plate_number: form.plate_number.trim(),
        device_id: form.device_id.trim(),
        bus_type: form.bus_type || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        is_active: form.is_active,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Vehicle registration failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div className="anim-up" style={{ width: "100%", maxWidth: 460, borderRadius: 18, padding: 20, background: "var(--bg-2)", border: "1px solid var(--neon-border)", boxShadow: "var(--shadow-neon)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={16} color="var(--neon)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>Register Vehicle</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Create a backend-managed bus record.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="label">Plate Number *</label>
            <input className="input" value={form.plate_number} onChange={(event) => setForm((current) => ({ ...current, plate_number: event.target.value }))} required placeholder="AA-3-B1234" />
          </div>
          <div>
            <label className="label">Device ID *</label>
            <div style={{ position: "relative" }}>
              <input className="input" style={{ paddingRight: 42, fontFamily: "var(--font-mono)" }} type={showDeviceId ? "text" : "password"} value={form.device_id} onChange={(event) => setForm((current) => ({ ...current, device_id: event.target.value }))} required placeholder="IMEI" />
              <button type="button" onClick={() => setShowDeviceId((current) => !current)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                {showDeviceId ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="label">Bus Type</label>
              <select className="input" value={form.bus_type} onChange={(event) => setForm((current) => ({ ...current, bus_type: event.target.value }))}>
                <option value="">Select…</option>
                {["Anbessa", "Sheger", "Minibus", "Electric", "Other"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacity</label>
              <input className="input" type="number" min={0} value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} placeholder="60" />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} style={{ accentColor: "var(--neon)" }} />
            Active in fleet
          </label>
          {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}><AlertCircle size={13} />{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {saving ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [assigningVehicle, setAssigningVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vehicleResponse, routeResponse] = await Promise.all([vehiclesApi.list(), routesApi.list()]);
      setVehicles(Array.isArray(vehicleResponse.data) ? vehicleResponse.data : []);
      setRoutes(Array.isArray(routeResponse.data) ? routeResponse.data : []);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      setVehicles([]);
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((entry) => filter === "all" || (filter === "active" ? entry.is_active : !entry.is_active));
  }, [vehicles, filter]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((entry) => entry.is_active).length,
    inactive: vehicles.filter((entry) => !entry.is_active).length,
    assigned: vehicles.filter((entry) => entry.route_id != null).length,
  }), [vehicles]);

  const actions: TableAction<Vehicle>[] = [
    {
      label: "Assign Route",
      icon: <MapPinned size={13} />,
      onClick: (row) => setAssigningVehicle(row),
    },
  ];

  const columns: ColDef<Vehicle>[] = [
    {
      key: "plate_number",
      label: "Vehicle",
      sortable: true,
      render: (entry) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bus size={15} color="var(--neon)" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{entry.plate_number}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{entry.device_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "bus_type",
      label: "Type",
      render: (entry) => entry.bus_type ? <span className="badge badge-cyan">{entry.bus_type}</span> : <span style={{ color: "var(--text-4)" }}>—</span>,
    },
    {
      key: "capacity",
      label: "Capacity",
      align: "center",
      render: (entry) => entry.capacity != null ? <span style={{ color: "var(--text-2)", fontSize: 13 }}>{entry.capacity} seats</span> : <span style={{ color: "var(--text-4)" }}>—</span>,
    },
    {
      key: "route_id",
      label: "Route",
      render: (entry) => {
        const route = routes.find((candidate) => candidate.id === entry.route_id);
        return route ? (
          <span className="badge" style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--cyan-border)" }}>
            <RouteIcon size={10} />
            {route.route_number}
          </span>
        ) : (
          <span style={{ color: "var(--text-4)" }}>Unassigned</span>
        );
      },
    },
    {
      key: "is_active",
      label: "Status",
      align: "center",
      render: (entry) => entry.is_active ? <span className="badge badge-green"><CheckCircle size={10} />Active</span> : <span className="badge badge-gray"><XCircle size={10} />Inactive</span>,
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showAdd && <RegisterVehicleModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {assigningVehicle && <VehicleModal vehicle={assigningVehicle} routes={routes} onClose={() => setAssigningVehicle(null)} onSaved={load} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Vehicles</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Fleet registry synced to the FastAPI backend</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setRefreshing(true); void load(); }} className="btn-secondary" disabled={refreshing}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} />Register Vehicle</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total", val: stats.total, color: "var(--text)", icon: <Bus size={15} /> },
          { label: "Active", val: stats.active, color: "var(--green)", icon: <CheckCircle size={15} /> },
          { label: "Inactive", val: stats.inactive, color: "var(--text-3)", icon: <XCircle size={15} /> },
          { label: "Assigned", val: stats.assigned, color: "var(--cyan)", icon: <MapPinned size={15} /> },
        ].map((entry) => (
          <div key={entry.label} className="card-sm" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{entry.label}</span>
              <span style={{ color: entry.color }}>{entry.icon}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: entry.color, fontFamily: "var(--font-display)", lineHeight: 1 }}>{entry.val}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {(["all", "active", "inactive"] as const).map((entry) => (
          <button
            key={entry}
            onClick={() => setFilter(entry)}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: filter === entry ? "var(--neon)" : "transparent", color: filter === entry ? "#000" : "var(--text-2)" }}
          >
            {entry}
          </button>
        ))}
      </div>

      <DataTable<Vehicle>
        data={filteredVehicles}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search plate, device ID, bus type…"
        searchKeys={["plate_number", "device_id", "bus_type"]}
        emptyMessage="No vehicles registered"
        pageSize={10}
        toolbar={<button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: "6px 12px" }}><Plus size={13} />Add</button>}
      />
    </div>
  );
}
