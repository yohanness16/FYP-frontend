"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { dashboardApi, vehiclesApi } from '@/lib/api';
import { DashboardInsights, ETAAccuracy, Vehicle } from '@/types';
import { RealTimeBusMapDynamic } from '@/components/Map/RealTimeBusMapDynamic';
import { StatCard } from '@/components/ui/StatCard';
import { PageLoader } from '@/components/ui/Spinner';
import { AssignmentsChart, OccupancyChart, TelemetryChart, RouteUsageChart } from '@/components/charts/Charts';
import { Radio, Bus, Route, Users, Activity, RefreshCw, Map, BarChart as BarChartIcon, Target, Info } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 24px 48px' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
            background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
            color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500
          }}>
            <BarChartIcon size={16} /> Overview
          </button>
        </Link>
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
            background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
            color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500
          }}>
            <Map size={16} /> Live Map
          </button>
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>Fleet Overview</h2>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
            Updated {formatDateTime(lastUpdated)} ({getLocalTimeZone()}) · auto-refreshes every 30s
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary" style={{ gap: 6 }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard title="Active Trips"    value={summary?.active_assignments ?? '—'} subtitle="Live now"    icon={<Radio size={17} />}    color="var(--green)" />
        <StatCard title="Vehicles"        value={summary?.vehicles ?? '—'}           subtitle="Registered"  icon={<Bus size={17} />}      color="var(--neon)" />
        <StatCard title="Routes"          value={summary?.routes ?? '—'}             subtitle="Configured"  icon={<Route size={17} />}    color="var(--cyan)" />
        <StatCard title="Users"           value={summary?.users ?? '—'}              subtitle="All roles"   icon={<Users size={17} />}    color="var(--purple)" />
        <StatCard title="Telemetry 24h"   value={summary?.telemetry_last_24h?.toLocaleString() ?? '—'} subtitle="GPS pings" icon={<Activity size={17} />} color="var(--amber)" />
      </div>

      {eta && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard title="ETA MAE (heuristic)" value={eta.heuristic_mae ?? '—'} subtitle="Admin benchmark" icon={<Target size={17} />} color="var(--cyan)" />
          <StatCard title="ETA MAE (ML)" value={eta.ml_mae ?? '—'} subtitle="When model trained" icon={<Target size={17} />} color="var(--purple)" />
          <StatCard title="ML Win Rate" value={`${eta.ml_win_rate ?? 0}%`} subtitle="ML better than heuristic" icon={<Target size={17} />} color="var(--green)" />
          <StatCard title="ETA Samples" value={eta.sample_count ?? 0} subtitle="Model performance rows" icon={<Activity size={17} />} color="var(--amber)" />
        </div>
      )}

      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Info size={16} color="var(--cyan)" style={{ marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>What ETA Preview Means</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            ETA Preview runs a simulated trip using the coordinates and stops you provide in Settings. It shows final ETA, heuristic baseline,
            and which mode (ML or heuristic) produced the returned value so you can validate model behavior before production use.
          </p>
        </div>
      </div>

      {insights && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 12 }}>Operational Insights (Last {insights.days} Days)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
            <div style={{ borderRadius: 10, padding: 12, background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Used Route</p>
              <p style={{ fontSize: 20, color: 'var(--neon)', fontWeight: 700, marginTop: 6 }}>{insights.top_route?.route_number ?? '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{insights.top_route?.name ?? 'No route data'} · {insights.top_route?.trips ?? 0} trips</p>
            </div>
            <div style={{ borderRadius: 10, padding: 12, background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Used Bus</p>
              <p style={{ fontSize: 20, color: 'var(--cyan)', fontWeight: 700, marginTop: 6 }}>{insights.top_vehicle?.plate_number ?? '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{insights.top_vehicle?.trips ?? 0} assignments started</p>
            </div>
            <div style={{ borderRadius: 10, padding: 12, background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Busiest Hours</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {insights.busiest_hours.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No assignment data</span>
                ) : insights.busiest_hours.map((h) => (
                  <span key={h.hour} className="badge" style={{ fontSize: 11 }}>{String(h.hour).padStart(2, '0')}:00 · {h.trips} trips</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Bus Map — flex so Leaflet fills the card without layout overflow */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: 'min(52vh, 560px)',
          maxHeight: '70vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexShrink: 0 }}>
          <Map size={15} color="var(--neon)" />
          <span className="section-title">Live Bus Positions — Addis Ababa</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <RealTimeBusMapDynamic
            vehicles={fleetVehicles}
            autoRefresh
            useLiveWs
            mapHeight="100%"
            positionIntervalMs={8000}
          />
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {assignments && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Assignments — Last 7 Days</p>
            <AssignmentsChart data={assignments} />
          </div>
        )}
        {telemetry && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Telemetry Volume — Last 24h</p>
            <TelemetryChart data={telemetry} />
          </div>
        )}
        {occupancy && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Occupancy Distribution</p>
            <OccupancyChart data={occupancy} />
          </div>
        )}
        {routeUsage && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Route Usage — Last 30 Days</p>
            <RouteUsageChart data={routeUsage} />
          </div>
        )}
      </div>
    </div>
  );
}