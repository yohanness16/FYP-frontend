"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, AlertCircle, Truck, User, ArrowLeftRight, Route, Wifi, Lock } from 'lucide-react';
import { RealTimeBusMapDynamic } from '@/components/Map/RealTimeBusMapDynamic';
import { api, authApi } from '@/lib/api';
import { VehiclePosition } from '@/types';

function DriverPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busId, setBusId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [busAssignment, setBusAssignment] = useState<any>(null);
  const [vehiclePosition, setVehiclePosition] = useState<VehiclePosition | null>(null);

  const loadBusAssignment = useCallback(async (busIdValue: string, driverIdValue: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/vehicles/${busIdValue}`);
      const vehicle = res.data;

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

      const posRes = await api.get(`/vehicles/positions/${vehicle.id}`);
      setVehiclePosition(posRes.data);
      setIsLoggedIn(true);
      setDriverId(driverIdValue);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to load bus assignment');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlBusId = searchParams.get('bus_id');
    const urlDriverId = searchParams.get('driver_id');

    if (!urlBusId) {
      router.push('/driver/login');
      return;
    }

    const resolvedDriverId = urlDriverId || localStorage.getItem('driver_id');
    if (!resolvedDriverId) {
      router.push(`/driver/login?bus_id=${urlBusId}`);
      return;
    }

    const driverToken = localStorage.getItem('driver_token');
    if (!driverToken) {
      router.push(`/driver/login?bus_id=${urlBusId}&driver_id=${resolvedDriverId}`);
      return;
    }

    setBusId(urlBusId);
    setDriverId(resolvedDriverId);
    loadBusAssignment(urlBusId, resolvedDriverId);
  }, [searchParams, router, loadBusAssignment]);

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('driver_session_id');
    if (sessionId) {
      try {
        await authApi.driverLogout(Number(sessionId));
      } catch {
        // Best-effort logout: local cleanup still happens.
      }
    }
    localStorage.removeItem('driver_token');
    localStorage.removeItem('token');
    localStorage.removeItem('driver_session_id');
    localStorage.removeItem('assigned_bus_id');
    localStorage.removeItem('driver_id');
    setIsLoggedIn(false);
    setVehiclePosition(null);
    setBusAssignment(null);
    router.push('/driver/login');
  };

  const refreshPosition = useCallback(async () => {
    if (busAssignment?.vehicle_id) {
      const posRes = await api.get(`/vehicles/positions/${busAssignment.vehicle_id}`);
      setVehiclePosition(posRes.data);
    }
  }, [busAssignment?.vehicle_id]);

  useEffect(() => {
    if (isLoggedIn && busAssignment?.vehicle_id) {
      refreshPosition();
      const interval = setInterval(refreshPosition, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, busAssignment?.vehicle_id, refreshPosition]);

  // Redirect if not properly assigned
  if (!busId || !driverId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  if (!busAssignment || !vehiclePosition) {
    return <div className="p-8 text-center">Loading bus data...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bus {busAssignment.vehicle_number}</h1>
          <p className="text-muted-foreground">
            Route: {busAssignment.route_number} • Capacity: {busAssignment.capacity} passengers
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      {/* KPI Cards */}
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
                <p className="text-2xl font-bold">{vehiclePosition?.speed || 0} km/h</p>
                <p className="text-xs text-muted-foreground">Speed</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{busAssignment.route_number}</p>
                <p className="text-xs text-muted-foreground">Route</p>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${vehiclePosition ? 'text-green-600' : 'text-yellow-600'}`}>
                  {vehiclePosition ? 'Moving' : 'Stopped'}
                </p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">
                {vehiclePosition ? `${vehiclePosition.lat.toFixed(4)}, ${vehiclePosition.lon.toFixed(4)}` : 'No position'}
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

      {/* Map */}
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

      {/* Route Information */}
      {busAssignment && (
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
                <p className="font-medium">{busAssignment.route_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Route Name</p>
                <p className="font-medium">{busAssignment.route_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stops</p>
                <p className="font-medium">{busAssignment.stops.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Stop</p>
                <p className="font-medium">{busAssignment.stops[0] || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DriverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    }>
      <DriverPageInner />
    </Suspense>
  );
}