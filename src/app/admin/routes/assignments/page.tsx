"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, Truck, MapPin, ArrowLeftRight, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Vehicle, Route, User as Driver } from '@/types';
import { getErrorMessage } from '@/lib/errorUtils';

interface FormData {
  vehicle_number: string;
  device_id: string;
  bus_type: string;
  capacity: number;
  route_id: number;
  driver_id: string;
  driver_password: string;
}

export default function AssignmentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    vehicle_number: '',
    device_id: '',
    bus_type: '',
    capacity: 0,
    route_id: 0,
    driver_id: '',
    driver_password: '',
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [vRes, rRes, dRes] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/routes'),
        api.get('/users'),
      ]);

      if (vRes.status === 'fulfilled') setVehicles(vRes.value.data);
      if (rRes.status === 'fulfilled') setRoutes(rRes.value.data);
      if (dRes.status === 'fulfilled') setDrivers(dRes.value.data.filter((u: any) => u.role === 'driver'));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let vehicleData = {
        plate_number: formData.vehicle_number,
        device_id: formData.device_id,
        bus_type: formData.bus_type,
        capacity: formData.capacity,
        route_id: formData.route_id || undefined,
      };

      if (editingId) {
        await api.put(`/vehicles/${editingId}`, vehicleData);
      } else {
        const vRes = await api.post('/vehicles', vehicleData);
        await api.post('/auth/driver-login', {
          device_id: formData.device_id,
          password: formData.driver_password,
          assigned_bus: vRes.data.id,
        });
        await api.put(`/vehicles/${vRes.data.id}`, { driver_id: formData.driver_id });
      }

      setOpen(false);
      setFormData({ vehicle_number: '', device_id: '', bus_type: '', capacity: 0, route_id: 0, driver_id: '', driver_password: '' });
      setEditingId(null);
      loadAllData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleUnassign = async (vehicleId: number) => {
    if (!confirm('Unassign driver from this bus?')) return;
    try {
      await api.put(`/vehicles/${vehicleId}`, { driver_id: null });
      loadAllData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Active Operations</h1>
          <p className="text-muted-foreground">Assign drivers to buses and manage operations</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Driver to Bus
        </Button>
      </div>

      <div className="grid gap-6">
        {vehicles.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{v.plate_number}</p>
                  <p className="text-sm text-muted-foreground">Device: {v.device_id}</p>
                  {v.route && (
                    <p className="text-sm text-muted-foreground">
                      Route: {v.route.route_number} - {v.route.name}
                    </p>
                  )}
                  {v.driver && (
                    <p className="text-sm text-muted-foreground">
                      Driver: {v.driver.name} (ID: {v.driver.id})
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded">
                    <ArrowLeftRight className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm">{v.driver ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex gap-2">
                  <Dialog open={open && editingId === v.id} onOpenChange={(o) => !o && setEditingId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Assign Driver to Bus</DialogTitle>
                        <DialogDescription>Link a driver to this vehicle</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAssign} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Vehicle Number</Label>
                          <Input value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Device ID</Label>
                          <Input value={formData.device_id} onChange={(e) => setFormData({ ...formData, device_id: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Bus Type</Label>
                          <Input value={formData.bus_type} onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Route</Label>
                          <Select value={formData.route_id?.toString()} onValueChange={(v) => setFormData({ ...formData, route_id: parseInt(v) })}>
                            <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                            <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.route_number} - {r.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Driver ID</Label>
                          <Input value={formData.driver_id} onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })} placeholder="Driver user ID" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Driver Password</Label>
                          <Input value={formData.driver_password} onChange={(e) => setFormData({ ...formData, driver_password: e.target.value })} type="password" required />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">{editingId ? 'Update Assignment' : 'Assign'}</Button>
                          {editingId && <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>}
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleUnassign(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Select({ children, value, onChange, placeholder, className, onValueChange }: { children?: React.ReactNode; value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string; onValueChange?: (v: string) => void }) {
  return (
    <select value={value} onChange={e => (onValueChange || onChange)?.(e.target.value)} className={`px-3 py-2 border rounded-md w-full ${className || ''}`}>
      <option value="" disabled>{placeholder || 'Select...'}</option>
      {children}
    </select>
  );
}

function Dialog({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange?: (v: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-card rounded-lg border p-6 w-full max-w-lg">{children}</div>
    </div>
  );
}

function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card ${className || ''}`}>{children}</div>;
}

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between mb-4">{children}</div>;
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm font-medium ${className || ''}`}>{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`px-3 py-2 border rounded-md w-full ${props.className || ''}`} />;
}

function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-3 py-2 border rounded-md ${className || ''}`}>
      {children}
    </div>
  );
}

function SelectValue({ placeholder }: { placeholder: string }) {
  return <span className="text-sm text-muted-foreground">{placeholder}</span>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 bg-card border rounded-md">{children}</div>;
}

function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return (
    <option value={value}>
      {children}
    </option>
  );
}

