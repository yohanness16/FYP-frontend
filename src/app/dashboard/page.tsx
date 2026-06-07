"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { dashboardApi, vehiclesApi } from '@/lib/api';
import { DashboardInsights, ETAAccuracy, Vehicle } from '@/types';
import { RealTimeBusMapDynamic } from '@/components/Map/RealTimeBusMapDynamic';
import { StatCard } from '@/components/ui/StatCard';
import { PageLoader } from '@/components/ui/Spinner';
import { AssignmentsChart, OccupancyChart, TelemetryChart, RouteUsageChart } from '@/components/charts/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Bus, Route, Users, Activity, RefreshCw, Map, Target, Info } from 'lucide-react';
import { formatDateTime, getLocalTimeZone } from '@/lib/time';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [assignments, setAssignments] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [routeUsage, setRouteUsage] = useState<any>(null);
  const [eta, setEta] = useState<ETAAccuracy | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        dashboardApi.summary(),
        dashboardApi.assignmentsOverTime(7),
        dashboardApi.occupancyDistribution(),
        dashboardApi.telemetryVolume(),
        dashboardApi.routeUsage(30),
        dashboardApi.etaAccuracy(),
        dashboardApi.insights(30),
        vehiclesApi.list(0, 200),
      ]);

      const getVal = (idx: number, key: string) => {
        if (results[idx].status === 'fulfilled') {
          const data = results[idx].value?.data;
          return data?.[key] || data;
        }
        return null;
      };

      setSummary(getVal(0, 'summary'));
      setAssignments(getVal(1, 'assignments'));
      setOccupancy(getVal(2, 'occupancy'));
      setTelemetry(getVal(3, 'telemetry'));
      setRouteUsage(getVal(4, 'routeUsage'));
      setEta(getVal(5, 'eta'));
      setInsights(getVal(6, 'insights'));

      if (results[7].status === 'fulfilled') {
        const raw = results[7].value?.data;
        setFleetVehicles(Array.isArray(raw) ? (raw as Vehicle[]) : []);
      } else {
        setFleetVehicles([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 30000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Fleet Overview
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Updated {formatDateTime(lastUpdated)} ({getLocalTimeZone()}) · auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/map" className="btn-secondary text-sm no-underline">
            <Map size={14} /> Live Map
          </Link>
          <button type="button" onClick={() => load(true)} disabled={refreshing} className="btn-secondary">
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Active Trips"    value={summary?.active_assignments ?? '—'} subtitle="Live now"    icon={<Radio size={17} />}    color="var(--neon)" />
        <StatCard title="Vehicles"        value={summary?.vehicles ?? '—'}           subtitle="Registered"  icon={<Bus size={17} />}      color="var(--neon-b)" />
        <StatCard title="Routes"          value={summary?.routes ?? '—'}             subtitle="Configured"  icon={<Route size={17} />}    color="var(--success)" />
        <StatCard title="Users"           value={summary?.users ?? '—'}              subtitle="All roles"   icon={<Users size={17} />}    color="var(--neon-p)" />
        <StatCard title="Telemetry 24h"   value={summary?.telemetry_last_24h?.toLocaleString() ?? '—'} subtitle="GPS pings" icon={<Activity size={17} />} color="var(--warning)" />
      </div>

      {/* ETA Accuracy row */}
      {eta && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="ETA MAE (heuristic)" value={eta.heuristic_mae ?? '—'} subtitle="Admin benchmark" icon={<Target size={17} />} color="var(--neon-b)" />
          <StatCard title="ETA MAE (ML)" value={eta.ml_mae ?? '—'} subtitle="When model trained" icon={<Target size={17} />} color="var(--neon-p)" />
          <StatCard title="ML Win Rate" value={`${eta.ml_win_rate ?? 0}%`} subtitle="ML better than heuristic" icon={<Target size={17} />} color="var(--success)" />
          <StatCard title="ETA Samples" value={eta.sample_count ?? 0} subtitle="Model performance rows" icon={<Activity size={17} />} color="var(--warning)" />
        </div>
      )}

      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">What ETA Preview Means</p>
            <p className="text-xs text-muted-foreground mt-1">
              ETA Preview runs a simulated trip using the coordinates and stops you provide in Settings. It shows final ETA, heuristic baseline,
              and which mode (ML or heuristic) produced the returned value so you can validate model behavior before production use.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Operational Insights */}
      {insights && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Operational Insights (Last {insights.days} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Most Used Route</p>
                <p className="text-xl font-bold text-primary mt-1">{insights.top_route?.route_number ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{insights.top_route?.name ?? 'No route data'} · {insights.top_route?.trips ?? 0} trips</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Most Used Bus</p>
                <p className="text-xl font-bold text-sky-500 mt-1">{insights.top_vehicle?.plate_number ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{insights.top_vehicle?.trips ?? 0} assignments started</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Busiest Hours</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {insights.busiest_hours.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No assignment data</span>
                  ) : insights.busiest_hours.map((h) => (
                    <span key={h.hour} className="badge badge-blue text-[10px]">{String(h.hour).padStart(2, '0')}:00 · {h.trips} trips</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Bus Map */}
      <Card className="flex flex-col min-h-0 h-[min(52vh,560px)]">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 shrink-0">
          <Map size={15} className="text-primary" />
          <CardTitle className="text-base">Live Bus Positions — Addis Ababa</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 pb-4">
          <RealTimeBusMapDynamic
            vehicles={fleetVehicles}
            autoRefresh
            useLiveWs
            mapHeight="100%"
            positionIntervalMs={8000}
          />
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assignments && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assignments — Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignmentsChart data={assignments} />
            </CardContent>
          </Card>
        )}
        {telemetry && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Telemetry Volume — Last 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <TelemetryChart data={telemetry} />
            </CardContent>
          </Card>
        )}
        {occupancy && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Occupancy Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <OccupancyChart data={occupancy} />
            </CardContent>
          </Card>
        )}
        {routeUsage && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Route Usage — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <RouteUsageChart data={routeUsage} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
