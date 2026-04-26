"use client";

import { useCallback, useEffect, useState } from "react";
import { vehiclesApi, routesApi } from "@/lib/api";
import { Vehicle, Route } from "@/types";
import { RealTimeBusMapDynamic } from "@/components/Map/RealTimeBusMapDynamic";
import { StatCard } from "@/components/ui/StatCard";
import { RefreshCw } from "lucide-react";

function parseList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return [];
}

export default function MapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilterId, setRouteFilterId] = useState<number | null>(null);
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
      setRoutes(parseList<Route>(rRes.data));
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
  const uniqueRouteIds = new Set(
    vehicles.map((v) => v.route_id).filter((id): id is number => id != null)
  ).size;

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
            Live tracking • Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            Route
            <select
              className="input"
              style={{ minWidth: 180, padding: "8px 10px" }}
              value={routeFilterId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setRouteFilterId(v === "" ? null : Number(v));
              }}
            >
              <option value="">All routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_number} — {r.name || r.origin || "Route"}
                </option>
              ))}
            </select>
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
          title="Last refresh"
          value={lastUpdate.toLocaleTimeString()}
          subtitle="Registry + map"
          icon={<span style={{ fontSize: 20 }}>⏱️</span>}
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
