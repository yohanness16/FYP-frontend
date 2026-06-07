"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeftRight, Eye, EyeOff, Lock, MapPin, Route, Truck, User, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RealTimeBusMapDynamic } from "@/components/Map/RealTimeBusMapDynamic";
import { api, authApi } from "@/lib/api";
import { VehiclePosition } from "@/types";

type Stage = "unlock" | "driver" | "ride";

type BusAssignment = {
  vehicle_id: number;
  vehicle_number: string;
  device_id: string;
  bus_type?: string | null;
  capacity?: number | null;
  route_id?: number | null;
  route_number?: string | null;
  route_name?: string | null;
  stops: string[];
};

export default function DriverBusDashboardPage() {
  const params = useParams<{ busId: string }>();
  const router = useRouter();
  const busId = useMemo(() => String(params?.busId || "").trim(), [params]);

  const [stage, setStage] = useState<Stage>("unlock");
  const [initializing, setInitializing] = useState(true);

  const [deviceId, setDeviceId] = useState("");
  const [busPassword, setBusPassword] = useState("");
  const [showBusPassword, setShowBusPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showDriverPassword, setShowDriverPassword] = useState(false);

  const [busToken, setBusToken] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [busAssignment, setBusAssignment] = useState<BusAssignment | null>(null);
  const [vehiclePosition, setVehiclePosition] = useState<VehiclePosition | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBusAssignment = useCallback(async (resolvedBusId: string, resolvedDriverId: string) => {
    const vehicleRes = await api.get(`/vehicles/${resolvedBusId}`);
    const vehicle = vehicleRes.data;

    setBusAssignment({
      vehicle_id: vehicle.id,
      vehicle_number: vehicle.plate_number,
      device_id: vehicle.device_id,
      bus_type: vehicle.bus_type,
      capacity: vehicle.capacity,
      route_id: vehicle.route_id,
      route_number: vehicle.route_number,
      route_name: vehicle.route_name,
      stops: vehicle.route_stops || [],
    });

    const positionRes = await api.get(`/vehicles/positions/${vehicle.id}`);
    setVehiclePosition(positionRes.data);
    setDriverId(resolvedDriverId);
  }, []);

  const refreshPosition = useCallback(async () => {
    if (!busAssignment?.vehicle_id) return;
    const posRes = await api.get(`/vehicles/positions/${busAssignment.vehicle_id}`);
    setVehiclePosition(posRes.data);
  }, [busAssignment?.vehicle_id]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!busId || Number.isNaN(Number(busId))) {
        setError("Invalid bus id");
        setInitializing(false);
        return;
      }

      const assignedBusId = localStorage.getItem("assigned_bus_id");
      const storedDriverId = localStorage.getItem("driver_id");
      const storedDriverToken = localStorage.getItem("driver_token");

      if (assignedBusId === busId && storedDriverId && storedDriverToken) {
        try {
          await loadBusAssignment(busId, storedDriverId);
          if (!mounted) return;
          setStage("ride");
        } catch {
          localStorage.removeItem("driver_token");
          localStorage.removeItem("token");
          localStorage.removeItem("driver_session_id");
          localStorage.removeItem("assigned_bus_id");
          localStorage.removeItem("driver_id");
          if (!mounted) return;
          setStage("unlock");
        }
      }

      if (mounted) setInitializing(false);
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [busId, loadBusAssignment]);

  useEffect(() => {
    if (stage !== "ride" || !busAssignment?.vehicle_id) return;
    void refreshPosition();
    const id = setInterval(() => {
      void refreshPosition();
    }, 5000);
    return () => clearInterval(id);
  }, [stage, busAssignment?.vehicle_id, refreshPosition]);

  const unlockBusDashboard = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const unlocked = await authApi.busDashboardLogin(Number(busId), deviceId, busPassword);
      setBusToken(unlocked.data.bus_token);
      setStage("driver");
      setBusPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to unlock bus dashboard");
    } finally {
      setLoading(false);
    }
  };

  const driverLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!busToken) {
      setError("Bus unlock token expired. Repeat admin unlock.");
      setStage("unlock");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.driverLogin(username, password, deviceId, busToken);

      localStorage.setItem("driver_token", res.data.token);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("driver_session_id", String(res.data.session_id));
      localStorage.setItem("assigned_bus_id", String(res.data.vehicle_id));
      localStorage.setItem("driver_id", String(res.data.driver_id));

      await loadBusAssignment(String(res.data.vehicle_id), String(res.data.driver_id));
      setStage("ride");
      setPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Driver login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const sessionId = localStorage.getItem("driver_session_id");
    if (sessionId) {
      try {
        await authApi.driverLogout(Number(sessionId));
      } catch {
        // Local cleanup still proceeds.
      }
    }

    localStorage.removeItem("driver_token");
    localStorage.removeItem("token");
    localStorage.removeItem("driver_session_id");
    localStorage.removeItem("assigned_bus_id");
    localStorage.removeItem("driver_id");

    setBusToken("");
    setUsername("");
    setPassword("");
    setDriverId(null);
    setBusAssignment(null);
    setVehiclePosition(null);
    setStage("unlock");
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (stage !== "ride") {
    const isUnlockStage = stage === "unlock";

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Bus Dashboard {busId}</h1>
            <p className="text-muted-foreground">
              {isUnlockStage
                ? "Step 1: Admin unlock this bus dashboard"
                : "Step 2: Driver login with personal credentials"}
            </p>
          </div>

          <Card className="p-6">
            {isUnlockStage ? (
              <form onSubmit={unlockBusDashboard} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Device ID (SIM7600 IMEI)</label>
                  <input
                    value={deviceId}
                    onChange={(event) => setDeviceId(event.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter bus device ID"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bus Dashboard Password</label>
                  <div className="relative">
                    <input
                      value={busPassword}
                      onChange={(event) => setBusPassword(event.target.value)}
                      className="w-full px-3 py-2 border rounded-md pr-10"
                      type={showBusPassword ? "text" : "password"}
                      placeholder="Enter bus dashboard password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowBusPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showBusPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <AlertCircle size={14} className="inline mr-2" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  {loading ? "Unlocking..." : `Unlock Bus ${busId}`}
                </button>
              </form>
            ) : (
              <form onSubmit={driverLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Driver Username</label>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter driver username"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Driver Password</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full px-3 py-2 border rounded-md pr-10"
                      type={showDriverPassword ? "text" : "password"}
                      placeholder="Enter driver password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDriverPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showDriverPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <AlertCircle size={14} className="inline mr-2" />
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStage("unlock")}
                    className="w-1/3 px-4 py-2 rounded-md border"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    {loading ? "Signing in..." : "Login as Driver"}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (!busAssignment || !vehiclePosition) {
    return <div className="p-8 text-center">Loading bus data...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bus {busAssignment.vehicle_number} Dashboard</h1>
          <p className="text-muted-foreground">
            Route: {busAssignment.route_number || "Unassigned"} • Capacity: {busAssignment.capacity ?? "N/A"}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <div className="grid gap-4 mb-6">
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" /> Bus Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{vehiclePosition.speed || 0} km/h</p>
                <p className="text-xs text-muted-foreground">Speed</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{busAssignment.route_number || "-"}</p>
                <p className="text-xs text-muted-foreground">Route</p>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${vehiclePosition ? "text-green-600" : "text-yellow-600"}`}>
                  {vehiclePosition ? "Moving" : "Stopped"}
                </p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center gap-4 flex-wrap">
            <div className="p-3 bg-blue-100 rounded-full">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">
                {`${vehiclePosition.lat.toFixed(4)}, ${vehiclePosition.lon.toFixed(4)}`}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connection</p>
              <p className="font-medium">Online</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driver</p>
              <p className="font-medium">ID: {driverId}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-[500px] mb-6">
        <CardContent className="p-0 h-full">
          <RealTimeBusMapDynamic
            vehicles={busAssignment && vehiclePosition ? [{
              id: busAssignment.vehicle_id,
              plate_number: busAssignment.vehicle_number,
              device_id: busAssignment.device_id,
              bus_type: busAssignment.bus_type ?? null,
              capacity: busAssignment.capacity ?? null,
              is_active: true,
              route_id: busAssignment.route_id ?? null,
              route_number: busAssignment.route_number ?? null,
              last_lat: vehiclePosition.lat,
              last_lon: vehiclePosition.lon,
              speed: vehiclePosition.speed,
            }] : []}
            autoRefresh
            useLiveWs
            mapHeight="100%"
            positionIntervalMs={5000}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Route Number</p>
              <p className="font-medium">{busAssignment.route_number || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Route Name</p>
              <p className="font-medium">{busAssignment.route_name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stops</p>
              <p className="font-medium">{busAssignment.stops.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Stop</p>
              <p className="font-medium">{busAssignment.stops[0] || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        This dashboard is bound to bus {busId} and validated by bus device ID + bus dashboard password before driver login.
      </div>
    </div>
  );
}
