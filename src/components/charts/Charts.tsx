"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartData } from "@/types";

const tt = (color: string) => ({ contentStyle: { background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, itemStyle: { color }, labelStyle: { color: "var(--text-2)" } });
const ASSIGNMENT_STROKE = "#3fc4ff";
const TELEMETRY_BAR = "#20d6c7";
const OCC_COLORS = ["#3fc4ff", "#22d3a8", "#f2b341", "#f56f7f"];
const ROUTE_COLORS = ["#3fc4ff", "#20d6c7", "#63e38d", "#f2b341", "#f56f7f", "#9a8dff"];

export function AssignmentsChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l, i) => ({ date: l.slice(5), value: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ASSIGNMENT_STROKE} stopOpacity={0.22} />
            <stop offset="95%" stopColor={ASSIGNMENT_STROKE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tt(ASSIGNMENT_STROKE)} />
        <Area type="monotone" dataKey="value" stroke={ASSIGNMENT_STROKE} strokeWidth={2} fill="url(#ag)" name="Trips" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TelemetryChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l, i) => ({ hour: l.slice(11, 16) || l, pings: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tt(TELEMETRY_BAR)} />
        <Bar dataKey="pings" fill={TELEMETRY_BAR} fillOpacity={0.84} radius={[3, 3, 0, 0]} name="Pings" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const OCC_NAMES = ["Low", "Medium", "High"];

export function OccupancyChart({ data }: { data: ChartData }) {
  const d = data.labels.map((_, i) => ({ name: OCC_NAMES[i] ?? data.labels[i], value: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={d} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
          {d.map((_, i) => <Cell key={i} fill={OCC_COLORS[i % OCC_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tt("var(--text)")} />
        <Legend formatter={v => <span style={{ color: "var(--text-2)", fontSize: 12 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RouteUsageChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l, i) => ({ route: l, trips: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={d} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="route" type="category" tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip {...tt("var(--text)")} />
        <Bar dataKey="trips" radius={[0, 4, 4, 0]} name="Trips">
          {d.map((_, i) => <Cell key={i} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} fillOpacity={0.86} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
