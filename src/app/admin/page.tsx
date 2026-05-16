"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MapPin, Truck, Route as RouteIcon, Users, Wifi, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Vehicle, VehiclePosition, Route, Assignment, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormData {
  plate_number: string;
  device_id: string;
  bus_type?: string;
  capacity?: number;
  route_id?: number;
}

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    plate_number: '',
    device_id: '',
    bus_type: '',
    capacity: undefined,
    route_id: undefined,
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vRes, rRes, aRes, uRes] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/routes'),
        api.get('/assignments'),
        api.get('/users'),
      ]);

      if (vRes.status === 'fulfilled') setVehicles(vRes.value.data);
      if (rRes.status === 'fulfilled') setRoutes(rRes.value.data);
      if (aRes.status === 'fulfilled') setAssignments(aRes.value.data);
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, formData);
      } else {
        await api.post('/vehicles', formData);
      }
      setOpen(false);
      setFormData({ plate_number: '', device_id: '', bus_type: '', capacity: undefined, route_id: undefined });
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete vehicle');
    }
  };

  const handleAssignRoute = async (vehicleId: number, routeId: number | null) => {
    try {
      await api.put(`/vehicles/${vehicleId}`, { route_id: routeId });
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign route');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const metrics = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.is_active).length,
    totalRoutes: routes.length,
    totalUsers: users.length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Fleet Management & Operations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
              <DialogDescription>
                Manage vehicle registration and route assignments
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Device ID (IMEI)</Label>
                <Input
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  placeholder="Enter device ID"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bus Type</Label>
                  <Input
                    value={formData.bus_type}
                    onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
                    placeholder="Yutong, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    placeholder="45"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Route Assignment</Label>
                <Select
                  value={formData.route_id?.toString()}
                  onValueChange={(v) => setFormData({ ...formData, route_id: v ? parseInt(v) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.route_number} - {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Add'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => {
                    setFormData({ plate_number: '', device_id: '', bus_type: '', capacity: undefined, route_id: undefined });
                    setEditingId(null);
                  }}>Cancel</Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold">{metrics.totalVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Vehicles</p>
                  <p className="text-2xl font-bold">{metrics.activeVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <RouteIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Routes</p>
                  <p className="text-2xl font-bold">{metrics.totalRoutes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                  <p className="text-2xl font-bold">{metrics.activeAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicles Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Vehicle Fleet ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {vehicles.map((v) => (
              <Card key={v.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{v.plate_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Device: {v.device_id} {v.bus_type && `| Type: ${v.bus_type}`}
                      </p>
                      {v.route && (
                        <p className="text-sm text-muted-foreground">
                          Route: {v.route.route_number} - {v.route.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded">
                      <Wifi className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm">
                      {positions.find(p => p.vehicle_id === v.id) ? 'Online' : 'Offline'}
                    </span>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Vehicle</DialogTitle>
                            <DialogDescription>Update vehicle information</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Plate Number</Label>
                              <Input
                                value={formData.plate_number}
                                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Device ID</Label>
                              <Input
                                value={formData.device_id}
                                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                                required
                                disabled={editingId !== null}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Bus Type</Label>
                                <Input
                                  value={formData.bus_type}
                                  onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Capacity</Label>
                                <Input
                                  type="number"
                                  value={formData.capacity || ''}
                                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Route Assignment</Label>
                              <Select
                                value={formData.route_id?.toString()}
                                onValueChange={(v) => setFormData({ ...formData, route_id: v ? parseInt(v) : undefined })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select route" />
                                </SelectTrigger>
                                <SelectContent>
                                  {routes.map(r => (
                                    <SelectItem key={r.id} value={r.id.toString()}>
                                      {r.route_number} - {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1">Update</Button>
                              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Routes Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Routes ({routes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {routes.map((route) => (
              <Card key={route.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{route.route_number} - {route.name}</p>
                    <p className="text-sm text-muted-foreground">{route.stops?.length || 0} stops | {route.distance_km} km</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}