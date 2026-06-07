"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MapPin, Truck, Route } from 'lucide-react';
import { api } from '@/lib/api';
import { Route as RouteType } from '@/types';
import { SafeText } from '@/components/SafeText';
import { getErrorMessage } from '@/lib/errorUtils';

interface FormData {
  route_number: string;
  name: string;
  distance_km: number;
  stops: string[];
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    route_number: '',
    name: '',
    distance_km: 0,
    stops: [''],
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/routes/${editingId}`, formData);
      } else {
        await api.post('/routes', formData);
      }
      setOpen(false);
      setFormData({ route_number: '', name: '', distance_km: 0, stops: [''] });
      setEditingId(null);
      loadRoutes();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this route?')) return;
    try {
      await api.delete(`/routes/${id}`);
      loadRoutes();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const addStop = () => {
    setFormData({ ...formData, stops: [...formData.stops, ''] });
  };

  const updateStop = (index: number, value: string) => {
    const newStops = [...formData.stops];
    newStops[index] = value;
    setFormData({ ...formData, stops: newStops });
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">Manage all bus routes and stops</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Route
        </Button>
      </div>

      <div className="grid gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded">
                  <Route className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{route.route_number} - {route.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {route.distance_km} km | {route.stops?.length ?? 0} stops
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={open && editingId === route.id} onOpenChange={(o) => !o && setEditingId(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Route</DialogTitle>
                      <DialogDescription>Update route details</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Route Number</Label>
                        <Input
                          value={formData.route_number}
                          onChange={e => setFormData({ ...formData, route_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Route Name</Label>
                        <Input
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Distance (km)</Label>
                        <Input
                          type="number"
                          value={formData.distance_km}
                          onChange={e => setFormData({ ...formData, distance_km: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Stops</Label>
                        {formData.stops.map((stop, i) => (
                          <Input
                            key={i}
                            value={stop}
                            onChange={e => updateStop(i, e.target.value)}
                            placeholder={`Stop ${i + 1}`}
                            className="mb-2"
                          />
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addStop}>
                          Add Stop
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Save</Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(route.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">Stops: </span>
              {(route.stops ?? []).map((s, i) => (
                <span key={i} className="text-sm">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  <SafeText value={s} />{i < (route.stops ?? []).length - 1 && ' → '}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Route' : 'Add New Route'}</DialogTitle>
            <DialogDescription>Create or update bus routes</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Route Number</Label>
              <Input
                value={formData.route_number}
                onChange={e => setFormData({ ...formData, route_number: e.target.value })}
                placeholder="e.g., 121"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Route name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.distance_km}
                onChange={e => setFormData({ ...formData, distance_km: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Stops</Label>
              {formData.stops.map((stop, i) => (
                <Input
                  key={i}
                  value={stop}
                  onChange={e => updateStop(i, e.target.value)}
                  placeholder={`Stop ${i + 1}`}
                  className="mb-2"
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                + Add Stop
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Add'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Dialog({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange?: (v: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => onOpenChange?.(false)}>
      <div className="bg-card rounded-lg border p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return asChild ? <>{children}</> : <div>{children}</div>;
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`px-3 py-2 border rounded-md w-full ${props.className || ''}`} />;
}