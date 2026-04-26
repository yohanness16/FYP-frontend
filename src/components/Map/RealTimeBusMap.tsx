/**
 * Real-time bus map: polls FastAPI for vehicle registry and live positions.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Vehicle, VehiclePosition } from "@/types";
import { api } from "@/lib/api";
import { useLiveVehiclePositions } from "@/hooks/useLiveVehiclePositions";

const DEFAULT_CENTER: [number, number] = [9.032, 38.752];
const DEFAULT_ZOOM = 12;
const FIT_MAX_ZOOM = 15;
const FIT_PADDING: [number, number] = [48, 48];

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const createBusIcon = (plate: string) => {
  const label = escapeHtml(plate.slice(-4).toUpperCase());
  const gradientId = `bus-gradient-${plate.replace(/[^a-zA-Z0-9]/g, "").slice(-12) || "live"}`;
  return L.divIcon({
    className: "bus-marker-icon",
    html: `
      <div style="position: relative; width: 44px; height: 54px; display: flex; flex-direction: column; align-items: center;">
        <svg width="44" height="46" viewBox="0 0 44 46" aria-hidden="true" style="filter: drop-shadow(0 6px 12px rgba(0, 229, 255, 0.28));">
          <rect x="8" y="4" width="28" height="34" rx="10" fill="url(#${gradientId})" stroke="#ffffff" stroke-width="2" />
          <rect x="12" y="10" width="20" height="7" rx="2" fill="rgba(255,255,255,0.24)" />
          <rect x="12" y="20" width="20" height="5" rx="2" fill="rgba(255,255,255,0.56)" />
          <rect x="12" y="28" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.26)" />
          <circle cx="15" cy="39" r="4" fill="#111827" stroke="#ffffff" stroke-width="2" />
          <circle cx="29" cy="39" r="4" fill="#111827" stroke="#ffffff" stroke-width="2" />
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00ffb4" />
              <stop offset="100%" stop-color="#00e5ff" />
            </linearGradient>
          </defs>
        </svg>
        <div style="margin-top: -2px; padding: 2px 8px; border-radius: 999px; background: rgba(4, 10, 20, 0.92); color: #e8fffd; border: 1px solid rgba(255,255,255,0.22); font-size: 9px; font-weight: 700; letter-spacing: 0.08em; box-shadow: 0 6px 12px rgba(0,0,0,0.25);">
          BUS {label || "LIVE"}
        </div>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 40],
    popupAnchor: [0, -36],
  });
};

function parseVehiclesList(data: unknown): Vehicle[] {
  if (Array.isArray(data)) return data as Vehicle[];
  if (data && typeof data === "object" && "vehicles" in data) {
    const v = (data as { vehicles?: unknown }).vehicles;
    return Array.isArray(v) ? (v as Vehicle[]) : [];
  }
  return [];
}

function parsePositions(data: unknown): Record<string, VehiclePosition> {
  if (!data || typeof data !== "object") return {};
  const pos = (data as { positions?: unknown }).positions;
  if (!pos || typeof pos !== "object") return {};
  return pos as Record<string, VehiclePosition>;
}

function MapFitBounds({
  points,
  refitKey,
  padding,
  maxZoom,
  minIntervalMs,
}: {
  points: [number, number][];
  /** When this changes (filter, fleet, route polyline), fit immediately. */
  refitKey: string;
  padding: [number, number];
  maxZoom: number;
  /** For live position updates only, minimum time between fitBounds calls. */
  minIntervalMs: number;
}) {
  const map = useMap();
  const lastFitAt = useRef(0);
  const prevRefitKey = useRef<string | null>(null);

  useEffect(() => {
    if (points.length === 0) return;
    const structural = prevRefitKey.current !== refitKey;
    prevRefitKey.current = refitKey;
    const now = Date.now();
    if (!structural && now - lastFitAt.current < minIntervalMs) {
      return;
    }
    lastFitAt.current = now;

    if (points.length === 1) {
      map.setView(points[0], Math.min(map.getZoom(), maxZoom));
      return;
    }
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding, maxZoom });
  }, [map, points, refitKey, padding, maxZoom, minIntervalMs]);

  return null;
}

interface RealTimeBusMapProps {
  vehicles?: Vehicle[];
  /** When set, only buses assigned to this route (by route_id) are shown. */
  routeFilterId?: number | null;
  autoRefresh?: boolean;
  /** How often to poll live positions (REST fallback; slower when WebSocket is on). */
  positionIntervalMs?: number;
  /** Admin WebSocket for instant position updates (requires logged-in admin). */
  useLiveWs?: boolean;
  /** CSS height for the map shell (e.g. `"100%"` inside a flex card). */
  mapHeight?: string | number;
}

export const RealTimeBusMap: React.FC<RealTimeBusMapProps> = ({
  vehicles = [],
  routeFilterId = null,
  autoRefresh = true,
  positionIntervalMs = 5000,
  useLiveWs = false,
  mapHeight = 600,
}) => {
  const { wsPositions, wsStatus } = useLiveVehiclePositions(Boolean(useLiveWs && autoRefresh));
  const [positions, setPositions] = useState<Record<string, VehiclePosition>>({});
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>(vehicles);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [routeLoadError, setRouteLoadError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await api.get("/vehicles/positions");
      setPositions(parsePositions(response.data));
    } catch (error) {
      console.error("Failed to fetch vehicle positions:", error);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await api.get("/vehicles");
      setVehiclesData(parseVehiclesList(response.data));
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  }, []);

  useEffect(() => {
    if (vehicles.length) {
      setVehiclesData(vehicles);
    }
  }, [vehicles]);

  const pollMs = useLiveWs ? Math.max(positionIntervalMs, 8000) : positionIntervalMs;

  useEffect(() => {
    if (autoRefresh) {
      fetchPositions();
      const id = setInterval(fetchPositions, pollMs);
      return () => clearInterval(id);
    }
    return undefined;
  }, [fetchPositions, autoRefresh, pollMs]);

  useEffect(() => {
    fetchVehicles();
    const regInterval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(regInterval);
  }, [fetchVehicles]);

  useEffect(() => {
    if (routeFilterId == null || routeFilterId === 0) {
      setRouteLine([]);
      setRouteLoadError(null);
      return;
    }
    let cancelled = false;
    setRouteLoadError(null);
    (async () => {
      try {
        const res = await api.get(`/routes/${routeFilterId}`);
        const stops = (res.data as { stops?: { lat: number; lon: number }[] })?.stops;
        if (!Array.isArray(stops) || stops.length === 0) {
          if (!cancelled) {
            setRouteLine([]);
            setRouteLoadError("No stops for this route.");
          }
          return;
        }
        const line: [number, number][] = stops.map((s) => [s.lat, s.lon]);
        if (!cancelled) setRouteLine(line);
      } catch {
        if (!cancelled) {
          setRouteLine([]);
          setRouteLoadError("Could not load route geometry.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeFilterId]);

  const mergedPositions = useMemo(() => {
    return { ...positions, ...wsPositions };
  }, [positions, wsPositions]);

  const filtered = vehiclesData.filter((v) => {
    if (routeFilterId == null || routeFilterId === 0) return true;
    return v.route_id === routeFilterId;
  });

  const posFresh = (pos: VehiclePosition | undefined) => {
    if (!pos?.timestamp) return false;
    const ageSec = Date.now() / 1000 - pos.timestamp;
    return ageSec >= 0 && ageSec < 120;
  };

  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const vehicle of filtered) {
      const pos = mergedPositions[String(vehicle.id)];
      const lat = pos?.lat ?? vehicle.last_lat;
      const lon = pos?.lon ?? vehicle.last_lon;
      if (lat != null && lon != null) {
        pts.push([lat, lon]);
      }
    }
    if (routeLine.length > 1) {
      for (const p of routeLine) pts.push(p);
    }
    return pts;
  }, [filtered, mergedPositions, routeLine]);

  const fitRefitKey = useMemo(() => {
    const ids = filtered
      .map((v) => v.id)
      .sort((a, b) => a - b)
      .join(",");
    const line =
      routeLine.length > 0
        ? routeLine.map((p) => `${p[0]},${p[1]}`).join(";")
        : "";
    return `${routeFilterId ?? "all"}|${ids}|${line}`;
  }, [filtered, routeFilterId, routeLine]);

  const showEmptyOverlay = filtered.length === 0;
  const heightStyle =
    typeof mapHeight === "number" ? `${mapHeight}px` : mapHeight;

  return (
    <div
      className="map-container"
      style={{
        height: heightStyle,
        minHeight: 280,
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        flex: typeof mapHeight === "string" && mapHeight === "100%" ? 1 : undefined,
        minWidth: 0,
      }}
    >
      {useLiveWs && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 400,
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(10,14,26,0.85)",
            color:
              wsStatus === "open"
                ? "var(--green)"
                : wsStatus === "connecting"
                  ? "var(--amber)"
                  : "var(--text-3)",
            border: "1px solid var(--border)",
            pointerEvents: "none",
          }}
        >
          Live: {wsStatus}
        </div>
      )}
      {showEmptyOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 450,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            background: "rgba(10, 14, 26, 0.55)",
            color: "var(--text-2)",
            fontSize: 14,
            textAlign: "center",
            padding: 16,
          }}
        >
          {routeFilterId
            ? "No vehicles assigned to this route. Clear the filter or assign route_id on buses."
            : "No vehicles registered yet."}
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        dragging
        preferCanvas
        minZoom={8}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapFitBounds
          points={fitPoints}
          refitKey={fitRefitKey}
          padding={FIT_PADDING}
          maxZoom={FIT_MAX_ZOOM}
          minIntervalMs={Math.max(pollMs * 2, 4000)}
        />

        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#00e5ff",
              weight: 4,
              opacity: 0.85,
            }}
          />
        )}

        {filtered.map((vehicle) => {
          const pos = mergedPositions[String(vehicle.id)];
          const lat = pos?.lat ?? vehicle.last_lat ?? DEFAULT_CENTER[0];
          const lon = pos?.lon ?? vehicle.last_lon ?? DEFAULT_CENTER[1];
          const active = posFresh(pos);

          return (
            <Marker
              key={vehicle.id}
              position={[lat, lon]}
              icon={createBusIcon(vehicle.plate_number)}
            >
              <Popup>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  {vehicle.plate_number}
                </div>
                <div style={{ fontSize: "12px", marginTop: 4 }}>
                  <div>Live GPS: {active ? "🟢 recent" : "⚪ stale / last known"}</div>
                  <div>
                    Speed: {(pos?.speed ?? vehicle.speed ?? 0).toFixed(1)} km/h
                  </div>
                  <div>
                    Route:{" "}
                    {vehicle.route_number ||
                      (vehicle.route_id != null ? `#${vehicle.route_id}` : "Unassigned")}
                  </div>
                  <div>Capacity: {vehicle.capacity ?? "—"} seats</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {routeLoadError && routeFilterId ? (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 500,
            fontSize: 12,
            color: "var(--amber)",
            background: "rgba(10,14,26,0.85)",
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          {routeLoadError}
        </div>
      ) : null}

      <style jsx>{`
        .map-container {
          position: relative;
          background: #0a0e1a;
        }
        .map-container :global(.leaflet-container) {
          z-index: 0;
        }
        .leaflet-marker-icon {
          transition: transform 0.2s ease;
        }
        .leaflet-marker-icon:hover {
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};

export default RealTimeBusMap;
