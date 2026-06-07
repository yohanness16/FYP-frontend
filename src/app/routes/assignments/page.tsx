"use client";

import { useState, useEffect, useCallback } from 'react';
import { assignmentsApi, vehiclesApi, routesApi, usersApi } from '@/lib/api';
import { Vehicle, Route, Assignment } from '@/types';
import { PageLoader } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Bus, MapPin, Play, Square, RefreshCw, Users, Clock, AlertCircle } from 'lucide-react';

export default function AssignmentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [formData, setFormData] = useState({ driver_id: 0, vehicle_id: 0, route_id: 0 });

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled([
        vehiclesApi.list(0, 200),
        routesApi.list(0, 200),
        assignmentsApi.listActive(),
        usersApi.listDrivers(),
      ]);
      if (results[0].status === 'fulfilled') setVehicles(Array.isArray(results[0].value.data) ? results[0].value.data : []);
      if (results[1].status === 'fulfilled') setRoutes(Array.isArray(results[1].value.data) ? results[1].value.data : []);
      if (results[2].status === 'fulfilled') setActiveAssignments(Array.isArray(results[2].value.data) ? results[2].value.data : []);
      if (results[3].status === 'fulfilled') setDrivers(Array.isArray(results[3].value.data) ? results[3].value.data : []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driver_id || !formData.vehicle_id || !formData.route_id) { setError("Please select driver, vehicle, and route"); return; }
    setStarting(true); setError(null);
    try { await assignmentsApi.start(formData.driver_id, formData.vehicle_id, formData.route_id); setFormData({ driver_id: 0, vehicle_id: 0, route_id: 0 }); await loadAll(); }
    catch (err: any) { setError(err.response?.data?.detail || err.message); }
    finally { setStarting(false); }
  };

  const handleEnd = async (assignmentId: number) => {
    if (!confirm('End this assignment?')) return;
    try { await assignmentsApi.end(assignmentId); await loadAll(); }
    catch (err: any) { setError(err.response?.data?.detail || err.message); }
  };

  if (loading) return <PageLoader />;

  const assignedVehicleIds = new Set(activeAssignments.map(a => a.vehicle_id));
  const unassignedVehicles = vehicles.filter(v => !assignedVehicleIds.has(v.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Live Trips</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage active driver-vehicle-route assignments</p>
        </div>
        <button onClick={loadAll} className="btn-secondary"><RefreshCw size={14} />Refresh</button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="flex items-center gap-2 pt-3 pb-3 text-sm text-destructive">
            <AlertCircle size={15} />{error}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center dark:bg-emerald-950/30 dark:border-emerald-800">
              <Play size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">{activeAssignments.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Active Trips</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Truck size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-primary">{unassignedVehicles.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Available Vehicles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center dark:bg-amber-950/30 dark:border-amber-800">
              <Users size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">{drivers.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Drivers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Assignment Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Play size={15} className="text-emerald-500" />Start New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[180px] flex-1">
              <label className="label">Driver</label>
              <select className="input" value={formData.driver_id} onChange={(e) => setFormData({ ...formData, driver_id: Number(e.target.value) })}>
                <option value={0}>Select driver…</option>
                {drivers.map(d => (<option key={d.id} value={d.id}>{d.username} ({d.email})</option>))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="label">Vehicle</label>
              <select className="input" value={formData.vehicle_id} onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}>
                <option value={0}>Select vehicle…</option>
                {unassignedVehicles.map(v => (<option key={v.id} value={v.id}>{v.plate_number} ({v.bus_type || "—"})</option>))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="label">Route</label>
              <select className="input" value={formData.route_id} onChange={(e) => setFormData({ ...formData, route_id: Number(e.target.value) })}>
                <option value={0}>Select route…</option>
                {routes.map(r => (<option key={r.id} value={r.id}>{r.route_number} — {r.name || r.origin || "Route"}</option>))}
              </select>
            </div>
            <Button type="submit" disabled={starting} className="btn-primary h-9">
              {starting ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : <><Play size={13} />Start</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Clock size={15} className="text-primary" />Active Assignments ({activeAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No active assignments</p>
              <p className="text-xs mt-1">Start a new assignment using the form above.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeAssignments.map((a) => (
                <Card key={a.id} className="border-border/60">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Bus size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{a.vehicle_plate || `Vehicle #${a.vehicle_id}`}</span>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">Active</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users size={10} />{a.driver_username || `Driver #${a.driver_id}`}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{a.route_number || `Route #${a.route_id}`}</span>
                            <span className="flex items-center gap-1"><Clock size={10} />{new Date(a.start_time).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleEnd(a.id)}>
                        <Square size={13} />End Trip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
