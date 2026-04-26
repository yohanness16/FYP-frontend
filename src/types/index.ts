/** Shared TypeScript types for admin dashboard. */

export interface User {
  id: number;
  username: string;
  email: string;
  role: "passenger" | "driver" | "admin";
  created_at: string;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  device_id: string;
  bus_type: string | null;
  capacity: number | null;
  is_active: boolean;
  route_id?: number | null;
  route_number?: string | null;
  last_lat?: number;
  last_lon?: number;
  speed?: number;
  position_updated_at?: string | null;
}

export interface VehiclePosition {
  vehicle_id: number;
  plate_number: string;
  lat: number;
  lon: number;
  speed: number;
  /** Unix seconds from backend */
  timestamp: number;
  route_id?: number | null;
}

export interface Stop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  base_dwell_time: number;
  is_terminal: boolean;
  peak_multiplier: number;
}

export interface Route {
  id: number;
  route_number: string;
  name: string | null;
  origin: string | null;
  destination: string | null;
}

export interface RouteWithStops extends Route {
  stops: Stop[];
}

export interface Assignment {
  id: number;
  driver_id: number;
  vehicle_id: number;
  route_id: number;
  start_time: string;
  end_time: string | null;
  status: "active" | "completed" | "cancelled";
  driver_username?: string | null;
  vehicle_plate?: string | null;
  route_number?: string | null;
}

export interface DashboardSummary {
  active_assignments: number;
  vehicles: number;
  routes: number;
  users: number;
  telemetry_last_24h: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface ETAAccuracy {
  heuristic_mae: number;
  ml_mae: number;
}

export interface MLStatus {
  model_loaded: boolean;
  model_version: string | null;
}

export interface EtaPreviewResult {
  eta_seconds: number;
  heuristic_eta_seconds: number;
  mode: string;
}

export interface CreatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface VehiclePositionsResponse {
  positions: Record<string, VehiclePosition>;
  timestamp: number;
}
