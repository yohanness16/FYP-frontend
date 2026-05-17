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
const TILE_LIGHT = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const BUS_ICON_PATH = "/icons/bus-route-marker.svg";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const createBusIcon = (plate: string) => {
  const label = escapeHtml(plate.slice(-4).toUpperCase());
  return L.divIcon({
    className: "bus-marker-icon",
    html: `
      <div style="position: relative; width: 58px; height: 76px; display: flex; align-items: center; justify-content: center;">
        <img src="${BUS_ICON_PATH}" alt="Bus marker" width="58" height="76" style="display:block; filter: drop-shadow(0 6px 10px rgba(9, 34, 63, 0.3));" />
        <div style="position:absolute; left:50%; top:56px; transform:translateX(-50%); padding:1px 6px; border-radius:999px; background:rgba(6,16,30,0.84); color:#ecf9ff; font-size:9px; font-weight:700; letter-spacing:0.06em; border:1px solid rgba(255,255,255,0.28);">
          ${label || "LIVE"}
        </div>
      </div>
    `,
    iconSize: [58, 76],
    iconAnchor: [29, 72],
    popupAnchor: [0, -66],
  });
};

function densityMeta(level: number | null | undefined) {
  if (level === 2) return { label: "High", color: "#e11d48" };
  if (level === 1) return { label: "Medium", color: "#d97706" };
  if (level === 0) return { label: "Low", color: "#15803d" };
  return { label: "Unknown", color: "#475569" };
}

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
  /** Optional density filter (0 low, 1 medium, 2 high). */
  densityFilter?: number | null;
  /** Optional minimum seat capacity filter. */
  minCapacity?: number;
  /** Optional list of route IDs allowed by stop-level filter. */
  allowedRouteIds?: number[] | null;
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
  densityFilter = null,
  minCapacity = 0,
  allowedRouteIds = null,
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
    if (routeFilterId != null && routeFilterId !== 0 && v.route_id !== routeFilterId) {
      return false;
    }
    if ((v.capacity ?? 0) < minCapacity) {
      return false;
    }
    if (Array.isArray(allowedRouteIds) && allowedRouteIds.length > 0) {
      if (v.route_id == null || !allowedRouteIds.includes(v.route_id)) {
        return false;
      }
    }
    if (densityFilter != null) {
      const pos = mergedPositions[String(v.id)];
      return pos?.density_level === densityFilter;
    }
    return true;
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
        <TileLayer url={TILE_LIGHT} attribution={TILE_ATTR} />

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
              color: "#0077bb",
              weight: 4,
              opacity: 0.82,
            }}
          />
        )}

        {filtered.map((vehicle) => {
          const pos = mergedPositions[String(vehicle.id)];
          const lat = pos?.lat ?? vehicle.last_lat ?? DEFAULT_CENTER[0];
          const lon = pos?.lon ?? vehicle.last_lon ?? DEFAULT_CENTER[1];
          const active = posFresh(pos);
          const density = densityMeta(pos?.density_level);

          return (
            <Marker
              key={vehicle.id}
              position={[lat, lon]}
              icon={createBusIcon(vehicle.plate_number)}
              eventHandlers={{
                click: (event) => {
                  event.target.openPopup();
                },
              }}
            >
              <Popup className="bus-popup">
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  {vehicle.plate_number}
                </div>
                <div style={{ fontSize: "12px", marginTop: 4 }}>
                  <div>Live GPS: {active ? "🟢 recent" : "⚪ stale / last known"}</div>
                  <div>
                    Density: <strong style={{ color: density.color }}>{density.label}</strong>
                    {pos?.pixel_count != null ? ` (${pos.pixel_count} px)` : ""}
                  </div>
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
          background: #d8e4f0;
        }
        .map-container :global(.leaflet-container) {
          z-index: 0;
          background: #d8e4f0;
        }
        .map-container :global(.leaflet-tile) {
          filter: none !important;
        }
        .map-container :global(.bus-popup .leaflet-popup-content-wrapper) {
          background: rgba(255, 255, 255, 0.99);
          color: #0c2438;
          border: 1px solid rgba(10, 60, 92, 0.24);
          box-shadow: 0 10px 28px rgba(18, 58, 92, 0.18);
        }
        .map-container :global(.bus-popup .leaflet-popup-tip) {
          background: rgba(255, 255, 255, 0.99);
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
