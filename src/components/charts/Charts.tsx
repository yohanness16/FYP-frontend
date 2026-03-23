"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartData } from "@/types";

const tt = (color: string) => ({ contentStyle: { background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, itemStyle: { color }, labelStyle: { color: "var(--text-2)" } });

export function AssignmentsChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l, i) => ({ date: l.slice(5), value: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={d} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--neon)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--neon)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tt("var(--neon)")} />
        <Area type="monotone" dataKey="value" stroke="var(--neon)" strokeWidth={2} fill="url(#ag)" name="Trips" />
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
        <Tooltip {...tt("var(--cyan)")} />
        <Bar dataKey="pings" fill="var(--cyan)" fillOpacity={0.8} radius={[3, 3, 0, 0]} name="Pings" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const OCC_COLORS = ["var(--green)", "var(--amber)", "var(--red)"];
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
  const COLORS = ["var(--neon)", "var(--cyan)", "var(--purple)", "var(--amber)", "var(--green)"];
  const d = data.labels.map((l, i) => ({ route: l, trips: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={d} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="route" type="category" tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip {...tt("var(--text)")} />
        <Bar dataKey="trips" radius={[0, 4, 4, 0]} name="Trips">
          {d.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
