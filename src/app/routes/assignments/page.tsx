"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Bus, MapPin, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Vehicle, Route } from '@/types';

interface FormData {
  vehicle_id: number;
  route_id: number;
}

export default function AssignmentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<Record<number, number>>({});

  const [formData, setFormData] = useState<FormData>({
    vehicle_id: 0,
    route_id: 0,
  });

  const loadAllData = useCallback(async () => {
    try {
      const [vRes, rRes] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/routes'),
      ]);

      if (vRes.status === 'fulfilled') {
        setVehicles(vRes.value.data);
        setCurrentAssignments(() => {
          const initial: Record<number, number> = {};
          vRes.value.data.forEach((v: Vehicle) => {
            initial[v.id] = v.route_id || 0;
          });
          return initial;
        });
      }
      if (rRes.status === 'fulfilled') setRoutes(rRes.value.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/vehicles/${formData.vehicle_id}`, { route_id: formData.route_id });
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnassign = async (vehicleId: number) => {
    if (!confirm('Unassign this vehicle from its route?')) return;
    try {
      await api.put(`/vehicles/${vehicleId}`, { route_id: null });
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Active Operations</h1>
          <p className="text-muted-foreground">Assign and manage vehicle-route operations</p>
        </div>
        <Button asChild>
          <a href="/routes/routes">
            <Plus className="mr-2 h-4 w-4" /> Manage Routes
          </a>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Assign Vehicles to Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="flex gap-4">
              <Select
                value={formData.vehicle_id}
                onChange={(v: string) => setFormData({ ...formData, vehicle_id: parseInt(v) })}
                placeholder="Select vehicle"
                className="flex-1"
              >
                {vehicles
                  .filter(v => v.route_id === null)
                  .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} ({v.bus_type}) - {v.device_id}
                    </option>
                  ))}
              </Select>
              <Select
                value={formData.route_id}
                onChange={(v: string) => setFormData({ ...formData, route_id: parseInt(v) })}
                placeholder="Select route"
                className="flex-1"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.route_number} - {r.name}
                  </option>
                ))}
              </Select>
              <Button type="submit">Assign</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" /> Current Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {vehicles.map((v) => (
                <Card key={v.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-100 rounded">
                        <Bus className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {v.plate_number} <span className="text-sm text-muted-foreground">({v.bus_type})</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{v.device_id}</p>
                      </div>
                    </div>
                    {v.route ? (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600" />
                          Route {v.route.route_number}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleUnassign(v.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Unassign
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm">Not Assigned</Button>
                    )}
                  </div>
                </Card>
              ))}
              {vehicles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No vehicles registered</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Select({ children, value, onChange, placeholder, className }: any) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-3 py-2 border rounded-md ${className || ''}`}
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
  );
}