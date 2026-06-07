"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bus,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  ArrowRight,
  Shield,
  Megaphone,
  Play,
  Square,
  XCircle,
  CheckCircle,
  Volume2,
} from "lucide-react";
import { api, authApi, routesApi, assignmentsApi, crowdApi, tripHistoryApi, announcementsApi } from "@/lib/api";
import { VehiclePosition, CvData, TripHistoryEntry } from "@/types";
import { RealTimeBusMapDynamic } from "@/components/Map/RealTimeBusMapDynamic";
import { BusDashboardHeader } from "@/components/bus-dashboard/BusDashboardHeader";
import { BusKpiRow } from "@/components/bus-dashboard/BusKpiRow";
import { OccupancyGauge } from "@/components/bus-dashboard/OccupancyGauge";
import { RouteProgress } from "@/components/bus-dashboard/RouteProgress";
import { CameraFeed } from "@/components/bus-dashboard/CameraFeed";
import { TripHistoryTable } from "@/components/bus-dashboard/TripHistoryTable";
import { DeviceStatus } from "@/components/bus-dashboard/DeviceStatus";
import { AssignmentControl } from "@/components/bus-dashboard/AssignmentControl";
import { useBusDashboardWebSocket } from "@/hooks/useBusDashboardWebSocket";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Stage = "unlock" | "driver" | "dashboard";

interface BusData {
  id: number;
  plate_number: string;
  device_id: string;
  bus_type: string | null;
  capacity: number | null;
  is_active: boolean;
  route_id: number | null;
  route_number: string | null;
  last_lat: number | null;
  last_lon: number | null;
  speed: number | null;
  position_updated_at: string | null;
}

interface RouteStopInfo {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteDetail {
  id: number;
  route_number: string;
  name: string;
  origin: string | null;
  destination: string | null;
  stops: RouteStopInfo[];
}

interface AssignmentInfo {
  id: number;
  route_number: string;
  status: string;
}

interface RouteOption {
  id: number;
  route_number: string;
  name: string;
}

type RideStatus = "idle" | "active" | "paused" | "ended";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestStopIndex(
  lat: number, lon: number, stops: RouteStopInfo[],
): number {
  if (stops.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = haversineDistance(lat, lon, stops[i].lat, stops[i].lon);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Announcement Panel Component                                       */
/* ------------------------------------------------------------------ */

function AnnouncementPanel({
  vehicleId,
  currentStopName,
  onAnnounce,
}: {
  vehicleId: number;
  currentStopName: string | null;
  onAnnounce: (msg: string) => void;
}) {
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementType, setAnnouncementType] = useState<"next_stop" | "current_stop" | "general">("next_stop");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const handleSend = async () => {
    if (!announcementMsg.trim()) return;
    setSending(true);
    try {
      await announcementsApi.create({
        vehicle_id: vehicleId,
        announcement_type: announcementType,
        message: announcementMsg.trim(),
        stop_name: currentStopName,
      });
      setLastSent(announcementMsg.trim());
      setAnnouncementMsg("");
      onAnnounce(announcementMsg.trim());
    } catch {
      // best effort
    } finally {
      setSending(false);
    }
  };

  const quickAnnouncements = currentStopName
    ? [
        `Now arriving at ${currentStopName}`,
        `Next stop: ${currentStopName}`,
        `Please prepare to disembark at ${currentStopName}`,
      ]
    : [];

  return (
    <div className="card-glow p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-4 w-4" style={{ color: "var(--neon)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
          Ride Announcement
        </span>
      </div>

      {/* Quick announcements */}
      {quickAnnouncements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickAnnouncements.map((qa) => (
            <button
              key={qa}
              className="text-[11px] px-2.5 py-1.5 rounded-lg"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                cursor: "pointer",
              }}
              onClick={() => {
                setAnnouncementMsg(qa);
              }}
            >
              <Volume2 className="inline h-3 w-3 mr-1" />
              {qa}
            </button>
          ))}
        </div>
      )}

      {/* Announcement type */}
      <div className="flex gap-2 mb-3">
        {(["next_stop", "current_stop", "general"] as const).map((t) => (
          <button
            key={t}
            className="text-[11px] px-2.5 py-1 rounded-md"
            style={{
              background: announcementType === t ? "var(--neon-dim)" : "var(--bg3)",
              border: `1px solid ${announcementType === t ? "var(--neon)" : "var(--border)"}`,
              color: announcementType === t ? "var(--neon)" : "var(--text3)",
              cursor: "pointer",
            }}
            onClick={() => setAnnouncementType(t)}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Message input */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Type announcement message..."
          value={announcementMsg}
          onChange={(e) => setAnnouncementMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSend(); }}
        />
        <button
          className="btn-primary justify-center"
          style={{ padding: "8px 14px" }}
          onClick={() => void handleSend()}
          disabled={sending || !announcementMsg.trim()}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#030507", borderTopColor: "transparent" }} />
          ) : (
            <Megaphone className="h-4 w-4" />
          )}
        </button>
      </div>

      {lastSent && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg text-[11px]" style={{ background: "var(--neon-dim)", color: "var(--neon)" }}>
          <CheckCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">Sent: &quot;{lastSent}&quot;</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ride Control Panel                                                 */
/* ------------------------------------------------------------------ */

function RideControlPanel({
  rideStatus,
  onStart,
  onPause,
  onResume,
  onEnd,
  onCancel,
}: {
  rideStatus: RideStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card-glow p-5">
      <div className="flex items-center gap-2 mb-4">
        <Play className="h-4 w-4" style={{ color: "var(--text3)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
          Ride Control
        </span>
        <span className={`ml-auto badge ${rideStatus === "active" ? "badge-green" : rideStatus === "paused" ? "badge-amber" : "badge-gray"}`}>
          {rideStatus.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rideStatus === "idle" && (
          <button className="btn-primary col-span-2 justify-center" onClick={onStart}>
            <Play className="h-4 w-4" /> Start Ride
          </button>
        )}
        {rideStatus === "active" && (
          <>
            <button className="btn-secondary justify-center" onClick={onPause}>
              <Square className="h-4 w-4" /> Pause
            </button>
            <button className="btn-danger justify-center" onClick={onEnd}>
              <CheckCircle className="h-4 w-4" /> End Ride
            </button>
          </>
        )}
        {rideStatus === "paused" && (
          <>
            <button className="btn-primary justify-center" onClick={onResume}>
              <Play className="h-4 w-4" /> Resume
            </button>
            <button className="btn-danger justify-center" onClick={onCancel}>
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          </>
        )}
        {rideStatus === "ended" && (
          <button className="btn-primary col-span-2 justify-center" onClick={onStart}>
            <Play className="h-4 w-4" /> Start New Ride
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function BusDashboardPage() {
  const params = useParams<{ busId: string }>();
  const router = useRouter();
  const busId = useMemo(() => String(params?.busId || "").trim(), [params]);

  // Stage
  const [stage, setStage] = useState<Stage>("unlock");
  const [initializing, setInitializing] = useState(true);

  // Auth forms
  const [deviceId, setDeviceId] = useState("");
  const [busPassword, setBusPassword] = useState("");
  const [showBusPass, setShowBusPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showDriverPass, setShowDriverPass] = useState(false);
  const [busToken, setBusToken] = useState("");

  // Dashboard state
  const [busData, setBusData] = useState<BusData | null>(null);
  const [vehiclePosition, setVehiclePosition] = useState<VehiclePosition | null>(null);
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [cvData, setCvData] = useState<CvData>({
    people_count: 0, crowd_density: 0, is_crowded: false, method: "n/a", confidence: 0, foreground_ratio: 0, image_path: null,
  });
  const [tripHistory, setTripHistory] = useState<TripHistoryEntry[]>([]);
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [allRoutes, setAllRoutes] = useState<RouteOption[]>([]);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [rideStatus, setRideStatus] = useState<RideStatus>("idle");

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastTelemetryRef = useRef<number>(Date.now());

  // WebSocket for live updates
  const wsVehicleId = busData?.id ?? null;
  const { position: wsPosition, cvData: wsCvData, status: wsStatus } = useBusDashboardWebSocket(
    stage === "dashboard" && wsVehicleId !== null,
    wsVehicleId,
  );

  // Merge WebSocket data
  useEffect(() => {
    if (wsPosition) {
      setVehiclePosition(wsPosition);
      lastTelemetryRef.current = Date.now();
      setIsOnline(true);
    }
  }, [wsPosition]);

  useEffect(() => {
    if (wsCvData) {
      setCvData(wsCvData);
    }
  }, [wsCvData]);

  /* ----- Load all dashboard data ----- */
  const loadDashboard = useCallback(async (vid: string) => {
    try {
      // Vehicle
      const vRes = await api.get(`/vehicles/${vid}`);
      const v: BusData = vRes.data;
      setBusData(v);

      // Position
      try {
        const posRes = await api.get(`/vehicles/positions/${v.id}`);
        setVehiclePosition(posRes.data);
      } catch {
        // no position yet
      }

      // Route detail
      if (v.route_id) {
        try {
          const rRes = await routesApi.get(v.route_id);
          setRouteDetail(rRes.data);
        } catch {
          // route might not exist
        }
      }

      // CV crowd data
      try {
        const cvRes = await crowdApi.getByPlate(v.plate_number);
        if (cvRes.data?.cv) {
          const cv = cvRes.data.cv;
          setCvData({
            people_count: cv.people_count || 0,
            crowd_density: cv.crowd_density || 0,
            is_crowded: cv.is_crowded || false,
            method: cv.method || "n/a",
            confidence: cv.confidence || 0,
            foreground_ratio: cv.foreground_ratio || 0,
            image_path: cvRes.data.image_path || null,
          });
        }
      } catch {
        // CV data might not be available yet
      }

      // Trip history
      try {
        const thRes = await tripHistoryApi.getByVehicle(v.id);
        if (Array.isArray(thRes.data)) {
          setTripHistory(thRes.data as TripHistoryEntry[]);
        }
      } catch {
        // Trip history endpoint might not exist yet — fallback to empty
      }

      // Active assignments for this vehicle
      try {
        const aRes = await assignmentsApi.listActive();
        const active = (aRes.data as any[]).find(
          (a: any) => a.vehicle_id === v.id && a.status === "active",
        );
        if (active) {
          setAssignment({
            id: active.id,
            route_number: active.route_number || String(active.route_id),
            status: active.status,
          });
          setRideStatus("active");
        }
      } catch {
        // non-admin might not have access
      }

      // All routes
      try {
        const routesRes = await routesApi.list();
        setAllRoutes(
          (routesRes.data as any[]).map((r: any) => ({
            id: r.id,
            route_number: r.route_number,
            name: r.name || r.route_number,
          })),
        );
      } catch {
        // fallback empty
      }
    } catch (err: unknown) {
      console.error("Dashboard load error:", err);
    }
  }, []);

  /* ----- Refresh position + telemetry data (polling fallback) ----- */
  const refreshLiveData = useCallback(async () => {
    if (!busData) return;
    try {
      const posRes = await api.get(`/vehicles/positions/${busData.id}`);
      setVehiclePosition(posRes.data);
      lastTelemetryRef.current = Date.now();
      setIsOnline(true);

      // Reload vehicle for latest data
      const vRes = await api.get(`/vehicles/${busData.id}`);
      setBusData(vRes.data);
    } catch {
      if (Date.now() - lastTelemetryRef.current > 30000) {
        setIsOnline(false);
      }
    }
  }, [busData]);

  /* ----- Init: check stored session ----- */
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!busId || isNaN(Number(busId))) {
        setError("Invalid bus ID");
        setInitializing(false);
        return;
      }

      const storedBusId = localStorage.getItem("bd_bus_id");
      const storedDriverToken = localStorage.getItem("driver_token");
      const storedDriverName = localStorage.getItem("bd_driver_name");

      if (storedBusId === busId && storedDriverToken) {
        try {
          await loadDashboard(busId);
          if (!mounted) return;
          setDriverName(storedDriverName);
          setStage("dashboard");
        } catch {
          localStorage.removeItem("driver_token");
          localStorage.removeItem("token");
          localStorage.removeItem("bd_bus_id");
          localStorage.removeItem("bd_driver_name");
          localStorage.removeItem("driver_session_id");
        }
      }
      if (mounted) setInitializing(false);
    };
    void init();
    return () => { mounted = false; };
  }, [busId, loadDashboard]);

  /* ----- Live refresh polling (slower when WebSocket is connected) ----- */
  useEffect(() => {
    if (stage !== "dashboard" || !busData) return;
    void refreshLiveData();
    const intervalMs = wsStatus === "open" ? 15000 : 5000;
    const id = setInterval(() => void refreshLiveData(), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, busData?.id, refreshLiveData, wsStatus]);

  /* ----- Auth: unlock bus ----- */
  const unlockBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.busDashboardLogin(Number(busId), deviceId, busPassword);
      setBusToken(res.data.access_token);
      setStage("driver");
      setBusPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to unlock bus dashboard");
    } finally {
      setLoading(false);
    }
  };

  /* ----- Auth: driver login ----- */
  const driverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!busToken) {
      setError("Bus token expired. Please unlock again.");
      setStage("unlock");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.driverLogin(username, password, deviceId, busToken);
      const data = res.data;
      localStorage.setItem("driver_token", data.access_token || data.token);
      localStorage.setItem("token", data.access_token || data.token);
      localStorage.setItem("driver_session_id", String(data.session_id));
      localStorage.setItem("bd_bus_id", String(data.vehicle_id));
      localStorage.setItem("bd_driver_name", username);

      setDriverName(username);
      await loadDashboard(String(data.vehicle_id));
      setStage("dashboard");
      setPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Driver login failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ----- Logout ----- */
  const logout = async () => {
    const sessionId = localStorage.getItem("driver_session_id");
    if (sessionId) {
      try { await authApi.driverLogout(Number(sessionId)); } catch { /* best effort */ }
    }
    localStorage.removeItem("driver_token");
    localStorage.removeItem("token");
    localStorage.removeItem("driver_session_id");
    localStorage.removeItem("bd_bus_id");
    localStorage.removeItem("bd_driver_name");
    setBusToken("");
    setUsername("");
    setPassword("");
    setDriverName(null);
    setBusData(null);
    setVehiclePosition(null);
    setRouteDetail(null);
    setAssignment(null);
    setTripHistory([]);
    setRideStatus("idle");
    setStage("unlock");
  };

  /* ----- Ride controls ----- */
  const handleStartRide = async () => {
    if (!busData) return;
    try {
      const meRes = await api.get("/auth/me");
      const driverId = meRes.data.id;
      const routeId = busData.route_id;
      if (!routeId) {
        setError("No route assigned to this bus. Ask admin to assign a route first.");
        return;
      }
      await assignmentsApi.start(driverId, busData.id, routeId);
      setRideStatus("active");
      await loadDashboard(String(busData.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to start ride");
    }
  };

  const handleEndRide = async () => {
    if (!assignment) return;
    try {
      await assignmentsApi.end(assignment.id);
      setRideStatus("ended");
      setAssignment(null);
      if (busData) await loadDashboard(String(busData.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to end ride");
    }
  };

  const handlePauseRide = () => {
    setRideStatus("paused");
  };

  const handleResumeRide = () => {
    setRideStatus("active");
  };

  const handleCancelRide = async () => {
    if (assignment) {
      try { await assignmentsApi.end(assignment.id); } catch { /* best effort */ }
    }
    setRideStatus("idle");
    setAssignment(null);
    if (busData) await loadDashboard(String(busData.id));
  };

  /* ----- Assignment handlers ----- */
  const handleStartAssignment = async (routeId: number) => {
    if (!busData) return;
    try {
      const meRes = await api.get("/auth/me");
      const driverId = meRes.data.id;
      await assignmentsApi.start(driverId, busData.id, routeId);
      await loadDashboard(String(busData.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to start assignment");
    }
  };

  const handleEndAssignment = async (assignmentId: number) => {
    try {
      await assignmentsApi.end(assignmentId);
      setAssignment(null);
      setRideStatus("ended");
      if (busData) await loadDashboard(String(busData.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to end assignment");
    }
  };

  /* ----- Derived data ----- */
  const nearestStopIndex = useMemo(() => {
    if (!vehiclePosition || !routeDetail?.stops?.length) return 0;
    return findNearestStopIndex(vehiclePosition.lat, vehiclePosition.lon, routeDetail.stops);
  }, [vehiclePosition, routeDetail]);

  const currentStopName = useMemo(() => {
    if (!routeDetail?.stops?.length) return null;
    return routeDetail.stops[nearestStopIndex]?.name || null;
  }, [routeDetail, nearestStopIndex]);

  const etaMinutes = useMemo(() => {
    if (!vehiclePosition || !routeDetail?.stops?.length) return null;
    const nextIdx = Math.min(nearestStopIndex + 1, routeDetail.stops.length - 1);
    const nextStop = routeDetail.stops[nextIdx];
    if (!nextStop) return null;
    const distKm = haversineDistance(vehiclePosition.lat, vehiclePosition.lon, nextStop.lat, nextStop.lon);
    const speed = vehiclePosition.speed || 20;
    return Math.max(1, Math.round((distKm / speed) * 60));
  }, [vehiclePosition, routeDetail, nearestStopIndex]);

  /* ================================================================ */
  /*  RENDER: LOADING                                                  */
  /* ================================================================ */

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "var(--neon)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text3)" }}>Initializing bus dashboard…</p>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: AUTH STAGES                                              */
  /* ================================================================ */

  if (stage !== "dashboard") {
    const isUnlock = stage === "unlock";

    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, var(--neon), transparent 70%)" }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--neon-dim), transparent)",
                border: "1px solid var(--border2)",
                boxShadow: "var(--neon-glow)",
              }}
            >
              {isUnlock ? (
                <Lock className="h-10 w-10" style={{ color: "var(--neon)" }} />
              ) : (
                <User className="h-10 w-10" style={{ color: "var(--neon)" }} />
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text)" }}>
              Bus #{busId}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              {/* Step indicators */}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "var(--neon)",
                    color: "#030507",
                  }}
                >1</div>
                <span className="text-xs font-medium" style={{ color: isUnlock ? "var(--neon)" : "var(--text2)" }}>
                  Unlock
                </span>
              </div>
              <div
                className="w-8 h-0.5 rounded"
                style={{ background: isUnlock ? "var(--border)" : "var(--neon)" }}
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isUnlock ? "var(--bg4)" : "var(--neon)",
                    color: isUnlock ? "var(--text3)" : "#030507",
                  }}
                >2</div>
                <span className="text-xs font-medium" style={{ color: isUnlock ? "var(--text3)" : "var(--neon)" }}>
                  Driver Login
                </span>
              </div>
            </div>
          </div>

          {/* Auth card */}
          <div className="card-glow p-6">
            {isUnlock ? (
              <form onSubmit={unlockBus} className="space-y-4">
                <div>
                  <label className="label">Device ID (SIM7600 IMEI)</label>
                  <input
                    className="input"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="Enter bus IoT device ID"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Bus Dashboard Password</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showBusPass ? "text" : "password"}
                      value={busPassword}
                      onChange={(e) => setBusPassword(e.target.value)}
                      placeholder="Enter dashboard password"
                      required
                    />
                    <button type="button" onClick={() => setShowBusPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text3)" }}>
                      {showBusPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-3 rounded-lg text-xs flex items-start gap-2"
                    style={{ background: "var(--neon-r-dim)", color: "var(--danger)", border: "1px solid rgba(255,34,85,0.3)" }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center" style={{ height: 44 }}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#030507", borderTopColor: "transparent" }} />
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Unlock Bus Dashboard
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={driverLogin} className="space-y-4">
                <div>
                  <label className="label">Driver Username</label>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showDriverPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <button type="button" onClick={() => setShowDriverPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text3)" }}>
                      {showDriverPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-3 rounded-lg text-xs flex items-start gap-2"
                    style={{ background: "var(--neon-r-dim)", color: "var(--danger)", border: "1px solid rgba(255,34,85,0.3)" }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStage("unlock")}
                    className="btn-secondary flex-1 justify-center">Back</button>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex-[2] justify-center" style={{ height: 44 }}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#030507", borderTopColor: "transparent" }} />
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Login & Start
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: DASHBOARD                                                */
  /* ================================================================ */

  if (!busData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--text3)" }}>Loading bus data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <BusDashboardHeader
        plateNumber={busData.plate_number}
        routeNumber={busData.route_number}
        driverName={driverName}
        isOnline={isOnline}
        onLogout={logout}
      />

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-5 space-y-4 lg:space-y-5 anim-fade-up">
        {/* KPI Row */}
        <BusKpiRow
          speed={vehiclePosition?.speed || busData.speed || 0}
          occupancyLevel={cvData.crowd_density}
          etaMinutes={etaMinutes}
          passengerCount={cvData.people_count}
        />

        {/* Main grid: Left (map + route) | Right (occupancy + camera + controls) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* LEFT column: Map + Route progress + Ride controls */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-5">
            {/* Live Map */}
            <div
              className="card-glow overflow-hidden"
              style={{ padding: 0, height: 420 }}
            >
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    📍 Live Location
                  </span>
                  {wsStatus === "open" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--neon-dim)", color: "var(--neon)" }}>
                      WS LIVE
                    </span>
                  )}
                </div>
                {vehiclePosition && (
                  <span className="text-[10px] font-mono" style={{ color: "var(--text3)" }}>
                    {vehiclePosition.lat.toFixed(5)}, {vehiclePosition.lon.toFixed(5)}
                  </span>
                )}
              </div>
              <div style={{ height: "calc(100% - 44px)" }}>
                <RealTimeBusMapDynamic
                  vehicles={busData ? [{
                    id: busData.id,
                    plate_number: busData.plate_number,
                    device_id: busData.device_id,
                    bus_type: busData.bus_type,
                    capacity: busData.capacity,
                    is_active: busData.is_active,
                    route_id: busData.route_id,
                    route_number: busData.route_number,
                    last_lat: vehiclePosition?.lat ?? busData.last_lat ?? undefined,
                    last_lon: vehiclePosition?.lon ?? busData.last_lon ?? undefined,
                    speed: vehiclePosition?.speed ?? busData.speed ?? undefined,
                    position_updated_at: busData.position_updated_at,
                  }] : []}
                  autoRefresh
                  useLiveWs={false}
                  mapHeight="100%"
                  positionIntervalMs={5000}
                />
              </div>
            </div>

            {/* Bottom row: Trip History + Assignment Control + Ride Control + Announcements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              <TripHistoryTable
                entries={tripHistory.map((th) => ({
                  id: th.id,
                  stopName: th.stop_name || `Stop #${th.stop_id}`,
                  arrivalTime: th.arrival_time || new Date().toISOString(),
                  dwellTime: null,
                  occupancyLevel: th.occupancy_level ?? null,
                }))}
              />
              <div className="space-y-4">
                <AssignmentControl
                  currentAssignment={assignment}
                  driverId={0}
                  vehicleId={busData.id}
                  routes={allRoutes}
                  onStartAssignment={handleStartAssignment}
                  onEndAssignment={handleEndAssignment}
                />
                <RideControlPanel
                  rideStatus={rideStatus}
                  onStart={handleStartRide}
                  onPause={handlePauseRide}
                  onResume={handleResumeRide}
                  onEnd={handleEndRide}
                  onCancel={handleCancelRide}
                />
                <AnnouncementPanel
                  vehicleId={busData.id}
                  currentStopName={currentStopName}
                  onAnnounce={() => { /* announcement sent */ }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT column: Occupancy + Camera + Route Progress + Device */}
          <div className="space-y-4 lg:space-y-5">
            <OccupancyGauge
              level={cvData.crowd_density}
              passengerCount={cvData.people_count}
              capacity={busData.capacity}
              confidence={cvData.confidence}
              method={cvData.method}
            />

            <CameraFeed
              imagePath={cvData.image_path}
              peopleCount={cvData.people_count}
              method={cvData.method}
              confidence={cvData.confidence}
              foregroundRatio={cvData.foreground_ratio}
              apiBaseUrl={API_URL}
            />

            <RouteProgress
              routeNumber={busData.route_number}
              routeName={routeDetail?.name || null}
              origin={routeDetail?.origin || null}
              destination={routeDetail?.destination || null}
              stops={routeDetail?.stops || []}
              nearestStopIndex={nearestStopIndex}
            />

            <DeviceStatus
              deviceId={busData.device_id}
              lastTelemetryAt={busData.position_updated_at}
              busType={busData.bus_type}
              isOnline={isOnline}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 text-center" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[10px]" style={{ color: "var(--text3)" }}>
          Smart Transport — Real-time Bus Monitoring & Density Tracking • Bus {busData.plate_number}
        </p>
      </footer>
    </div>
  );
}
