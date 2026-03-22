"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "@/types";

const TT = ({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
      <p style={{ color:"var(--brand)", fontWeight:600 }}>{payload[0].value} trips</p>
    </div>
  );
};

export function AssignmentsChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l,i) => ({ date: l.slice(5), value: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={d} margin={{ top:4, right:4, left:-24, bottom:0 }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2f81f7" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#2f81f7" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
        <XAxis dataKey="date" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false}/>
        <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
        <Tooltip content={<TT/>}/>
        <Area type="monotone" dataKey="value" stroke="#2f81f7" strokeWidth={2} fill="url(#ag)"/>
      </AreaChart>
    </ResponsiveContainer>
  );
}
