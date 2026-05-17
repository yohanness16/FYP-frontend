"use client";

import { useCallback, useEffect, useState } from "react";
import { vehiclesApi, routesApi } from "@/lib/api";
import { Vehicle, Route, Stop } from "@/types";
import { RealTimeBusMapDynamic } from "@/components/Map/RealTimeBusMapDynamic";
import { StatCard } from "@/components/ui/StatCard";
import { RefreshCw } from "lucide-react";
import { formatDateTime, getLocalTimeZone } from "@/lib/time";

function parseList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return [];
}

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
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [vRes, rRes] = await Promise.all([
        vehiclesApi.list(),
        routesApi.list(),
      ]);
      setVehicles(parseList<Vehicle>(vRes.data));
      const routeList = parseList<Route>(rRes.data);
      setRoutes(routeList);

      const routeDetailResults = await Promise.allSettled(
        routeList.map((route) => routesApi.get(route.id))
      );
      const nextStopsByRoute: Record<number, Stop[]> = {};
      const nextRouteIdsByStop: Record<number, number[]> = {};
      routeDetailResults.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const routeId = routeList[index].id;
        const stops = Array.isArray(result.value.data?.stops)
          ? (result.value.data.stops as Stop[])
          : [];
        nextStopsByRoute[routeId] = stops;
        for (const stop of stops) {
          const current = nextRouteIdsByStop[stop.id] || [];
          if (!current.includes(routeId)) current.push(routeId);
          nextRouteIdsByStop[stop.id] = current;
        }
      });
      setStopsByRoute(nextStopsByRoute);
      setRouteIdsByStop(nextRouteIdsByStop);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch map data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && vehicles.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <RefreshCw
          size={40}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeCount = vehicles.filter((v) => v.is_active).length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity ?? 0), 0);
  const avgCapacity = vehicles.length > 0 ? Math.round(totalCapacity / vehicles.length) : 0;
  const uniqueRouteIds = new Set(
    vehicles.map((v) => v.route_id).filter((id): id is number => id != null)
  ).size;
  const filteredRoutes = routes.filter((route) => {
    if (!routeNumberQuery.trim()) return true;
    return route.route_number.toLowerCase().includes(routeNumberQuery.trim().toLowerCase());
  });
  const stopOptions = routeFilterId != null
    ? (stopsByRoute[routeFilterId] || [])
    : Object.values(stopsByRoute).flat().filter((stop, index, arr) => arr.findIndex((s) => s.id === stop.id) === index);
  const allowedRouteIds = stopFilterId != null ? (routeIdsByStop[stopFilterId] || []) : null;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1920px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minHeight: "calc(100vh - 48px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            Real-Time Bus Map
          </h1>
          <p style={{ color: "var(--text-3)", marginTop: 4 }}>
            Live tracking • Updated {formatDateTime(lastUpdate)} ({getLocalTimeZone()})
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Route number
            <input
              className="input"
              type="text"
              placeholder="e.g. 110"
              value={routeNumberQuery}
              onChange={(e) => setRouteNumberQuery(e.target.value)}
              style={{ width: 130, padding: "8px 10px" }}
            />
          </label>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Route
            <select
              className="input"
              style={{ minWidth: 180, padding: "8px 10px" }}
              value={routeFilterId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setRouteFilterId(v === "" ? null : Number(v));
                setStopFilterId(null);
              }}
            >
              <option value="">All routes</option>
              {filteredRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_number} — {r.name || r.origin || "Route"}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Stop
            <select
              className="input"
              style={{ minWidth: 210, padding: "8px 10px" }}
              value={stopFilterId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setStopFilterId(value === "" ? null : Number(value));
              }}
            >
              <option value="">All stops</option>
              {stopOptions.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Density
            <select
              className="input"
              style={{ minWidth: 140, padding: "8px 10px" }}
              value={densityFilter ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setDensityFilter(value === "" ? null : Number(value));
              }}
            >
              <option value="">All levels</option>
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High</option>
            </select>
          </label>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Min capacity
            <input
              className="input"
              type="number"
              min={0}
              step={5}
              value={minCapacity}
              onChange={(e) => setMinCapacity(Math.max(0, Number(e.target.value) || 0))}
              style={{ width: 110, padding: "8px 10px" }}
            />
          </label>
          <button
            type="button"
            onClick={() => fetchData(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "var(--neon)",
              border: "none",
              borderRadius: 8,
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <StatCard
          title="Active fleet"
          value={activeCount}
          subtitle="is_active"
          icon={<span style={{ fontSize: 20 }}>🚌</span>}
          color="var(--green)"
        />
        <StatCard
          title="Routes in use"
          value={uniqueRouteIds}
          subtitle="Assigned vehicles"
          icon={<span style={{ fontSize: 20 }}>📍</span>}
          color="var(--cyan)"
        />
        <StatCard
          title="Registered buses"
          value={vehicles.length}
          subtitle="Total vehicles"
          icon={<span style={{ fontSize: 20 }}>📶</span>}
          color="var(--amber)"
        />
        <StatCard
          title="Avg capacity"
          value={`${avgCapacity} seats`}
          subtitle={`Fleet seats: ${totalCapacity}`}
          icon={<span style={{ fontSize: 20 }}>👥</span>}
          color="var(--purple)"
        />
      </div>

      <div
        className="card"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          height: "calc(100vh - 220px)",
          maxHeight: "900px",
        }}
      >
        <RealTimeBusMapDynamic
          vehicles={vehicles}
          routeFilterId={routeFilterId}
          allowedRouteIds={allowedRouteIds}
          densityFilter={densityFilter}
          minCapacity={minCapacity}
          autoRefresh
          useLiveWs
          mapHeight="100%"
          positionIntervalMs={4000}
        />
      </div>

      <style>{`
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
        }
        .bus-marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
}
