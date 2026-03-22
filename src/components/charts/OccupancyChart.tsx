"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartData } from "@/types";

const COLORS = ["#3fb950","#d29922","#f85149"];
const NAMES  = ["Low","Medium","High"];

export function OccupancyChart({ data }: { data: ChartData }) {
  const d = data.labels.map((_,i) => ({ name: NAMES[i] ?? data.labels[i], value: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={d} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
          {d.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
        </Pie>
        <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} itemStyle={{ color:"var(--text-primary)" }} labelStyle={{ color:"var(--text-secondary)" }}/>
        <Legend formatter={v => <span style={{ color:"var(--text-secondary)", fontSize:12 }}>{v}</span>}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
