import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (username: string, password: string) => api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

export const dashboardApi = {
  summary: () => api.get("/admin/dashboard/summary"),
  assignmentsOverTime: (days = 7) => api.get(`/admin/dashboard/assignments-over-time?days=${days}`),
  occupancyDistribution: () => api.get("/admin/dashboard/occupancy-distribution"),
  etaAccuracy: () => api.get("/admin/dashboard/eta-accuracy"),
  routeUsage: (days = 30) => api.get(`/admin/dashboard/route-usage?days=${days}`),
  telemetryVolume: () => api.get("/admin/dashboard/telemetry-volume"),
};

export const vehiclesApi = {
  list: (skip = 0, limit = 100) => api.get(`/vehicles?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/vehicles/${id}`),
  create: (data: { plate_number: string; device_id: string; bus_type?: string; capacity?: number; is_active?: boolean }) =>
    api.post("/vehicles", data),
};

export const routesApi = {
  list: () => api.get("/routes?limit=100"),
  get: (id: number) => api.get(`/routes/${id}`),
  create: (data: { route_number: string; name?: string; origin?: string; destination?: string; stops?: { stop_id: number; sequence_order: number }[] }) =>
    api.post("/routes", data),
  listStops: () => api.get("/stops?limit=100"),
  createStop: (data: { name: string; lat: number; lon: number; base_dwell_time?: number; is_terminal?: boolean; peak_multiplier?: number }) =>
    api.post("/stops", data),
};

export const usersApi = {
  createAdmin: (data: { username: string; email: string; password: string; role: "driver" | "admin" }) =>
    api.post("/create", data),
  listadmins:() => api.get("/admins"),
  listdrivers:()=>api.get("/drivers"),
  delete: (id: number) => api.delete(`/delete/${id}`),
};

export const adminApi = {
  mlStatus: () => api.get("/admin/ml/status"),
  trainModel: () => api.post("/admin/ml/train"),
  cleanup: () => api.post("/admin/cleanup"),
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (use_ml_for_prod: boolean) => api.put("/admin/settings", { use_ml_for_prod }),
};

export const assignmentsApi = {
  start: (driver_id: number, vehicle_id: number, route_id: number) =>
    api.post("/assignments/start", { driver_id, vehicle_id, route_id }),
  end: (assignment_id: number) => api.post("/assignments/end", { assignment_id }),
};
