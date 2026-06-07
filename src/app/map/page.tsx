"use client";

import { useCallback, useEffect, useState } from "react";
import { vehiclesApi, routesApi } from "@/lib/api";
import { Vehicle, Route, Stop } from "@/types";
import { RealTimeBusMapDynamic } from "@/components/Map/RealTimeBusMapDynamic";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { formatDateTime, getLocalTimeZone } from "@/lib/time";

function parseList<T>(data: unknown): T[] { if (Array.isArray(data)) return data as T[]; return []; }

export default function MapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilterId, setRouteFilterId] = useState<number | null>(null);
  const [routeNumberQuery, setRouteNumberQuery] = useState("");
  const [stopFilterId, setStopFilterId] = useState<number | null>(null);
  const [densityFilter, setDensityFilter] = useState<number | null>(null);
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [stopsByRoute, setStopsByRoute] = useState<Record<number, Stop[]>>({});
  const [routeIdsByStop, setRouteIdsByStop] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [vRes, rRes] = await Promise.all([vehiclesApi.list(), routesApi.list()]);
      setVehicles(parseList<Vehicle>(vRes.data));
      const routeList = parseList<Route>(rRes.data);
      setRoutes(routeList);
      const routeDetailResults = await Promise.allSettled(routeList.map((route) => routesApi.get(route.id)));
      const nextStopsByRoute: Record<number, Stop[]> = {};
      const nextRouteIdsByStop: Record<number, number[]> = {};
      routeDetailResults.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const routeId = routeList[index].id;
        const stops = Array.isArray(result.value.data?.stops) ? (result.value.data.stops as Stop[]) : [];
        nextStopsByRoute[routeId] = stops;
        for (const stop of stops) { const current = nextRouteIdsByStop[stop.id] || []; if (!current.includes(routeId)) current.push(routeId); nextRouteIdsByStop[stop.id] = current; }
      });
      setStopsByRoute(nextStopsByRoute);
      setRouteIdsByStop(nextRouteIdsByStop);
      setLastUpdate(new Date());
    } catch (error) { console.error("Failed to fetch map data:", error); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(() => fetchData(true), 10000); return () => clearInterval(interval); }, [fetchData]);

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = vehicles.filter((v) => v.is_active).length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity ?? 0), 0);
  const avgCapacity = vehicles.length > 0 ? Math.round(totalCapacity / vehicles.length) : 0;
  const uniqueRouteIds = new Set(vehicles.map((v) => v.route_id).filter((id): id is number => id != null)).size;
  const filteredRoutes = routes.filter((route) => { if (!routeNumberQuery.trim()) return true; return route.route_number.toLowerCase().includes(routeNumberQuery.trim().toLowerCase()); });
  const stopOptions = routeFilterId != null ? (stopsByRoute[routeFilterId] || []) : Object.values(stopsByRoute).flat().filter((stop, index, arr) => arr.findIndex((s) => s.id === stop.id) === index);
  const allowedRouteIds = stopFilterId != null ? (routeIdsByStop[stopFilterId] || []) : null;

  return (
    <div className="p-6 max-w-[1920px] mx-auto flex flex-col gap-0 box-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Real-Time Bus Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Live tracking · Updated {formatDateTime(lastUpdate)} ({getLocalTimeZone()})</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-foreground/70 flex items-center gap-2">
            Route number
            <input className="input w-32 py-2" type="text" placeholder="e.g. 110" value={routeNumberQuery} onChange={(e) => setRouteNumberQuery(e.target.value)} />
          </label>
          <label className="text-sm text-foreground/70 flex items-center gap-2">
            Route
            <select className="input min-w-[180px] py-2" value={routeFilterId ?? ""} onChange={(e) => { const v = e.target.value; setRouteFilterId(v === "" ? null : Number(v)); setStopFilterId(null); }}>
              <option value="">All routes</option>
              {filteredRoutes.map((r) => (<option key={r.id} value={r.id}>{r.route_number} — {r.name || r.origin || "Route"}</option>))}
            </select>
          </label>
          <label className="text-sm text-foreground/70 flex items-center gap-2">
            Stop
            <select className="input min-w-[210px] py-2" value={stopFilterId ?? ""} onChange={(e) => { const v = e.target.value; setStopFilterId(v === "" ? null : Number(v)); }}>
              <option value="">All stops</option>
              {stopOptions.map((stop) => (<option key={stop.id} value={stop.id}>{stop.name}</option>))}
            </select>
          </label>
          <label className="text-sm text-foreground/70 flex items-center gap-2">
            Density
            <select className="input min-w-[140px] py-2" value={densityFilter ?? ""} onChange={(e) => { const v = e.target.value; setDensityFilter(v === "" ? null : Number(v)); }}>
              <option value="">All levels</option><option value="0">Low</option><option value="1">Medium</option><option value="2">High</option>
            </select>
          </label>
          <label className="text-sm text-foreground/70 flex items-center gap-2">
            Min capacity
            <input className="input w-28 py-2" type="number" min={0} step={5} value={minCapacity} onChange={(e) => setMinCapacity(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <button type="button" onClick={() => fetchData(true)} className="btn-primary h-9">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-5 shrink-0">
        <StatCard title="Active fleet" value={activeCount} subtitle="is_active" icon={<span className="text-xl">🚌</span>} color="var(--success)" />
        <StatCard title="Routes in use" value={uniqueRouteIds} subtitle="Assigned vehicles" icon={<span className="text-xl">📍</span>} color="var(--neon-b)" />
        <StatCard title="Registered buses" value={vehicles.length} subtitle="Total vehicles" icon={<span className="text-xl">📶</span>} color="var(--warning)" />
        <StatCard title="Avg capacity" value={`${avgCapacity} seats`} subtitle={`Fleet seats: ${totalCapacity}`} icon={<span className="text-xl">👥</span>} color="var(--neon-p)" />
      </div>

      {/* Map */}
      <Card className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden h-[calc(100vh-220px)] max-h-[900px]">
        <RealTimeBusMapDynamic vehicles={vehicles} routeFilterId={routeFilterId} allowedRouteIds={allowedRouteIds} densityFilter={densityFilter} minCapacity={minCapacity} autoRefresh useLiveWs mapHeight="100%" positionIntervalMs={4000} />
      </Card>

      <style>{`.leaflet-container { height: 100% !important; width: 100% !important; } .bus-marker-icon { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }`}</style>
    </div>
  );
}
