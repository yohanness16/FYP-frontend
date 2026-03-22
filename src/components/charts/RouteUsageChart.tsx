"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartData } from "@/types";

const COLORS = ["#2f81f7","#3fb950","#d29922","#f85149","#8b5cf6"];

export function RouteUsageChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l,i) => ({ route:l, trips:data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={d} layout="vertical" margin={{ top:4, right:16, left:8, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
        <XAxis type="number" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false}/>
        <YAxis dataKey="route" type="category" tick={{ fill:"var(--text-secondary)", fontSize:11 }} axisLine={false} tickLine={false} width={56}/>
        <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} itemStyle={{ color:"var(--text-primary)" }} labelStyle={{ color:"var(--text-secondary)" }}/>
        <Bar dataKey="trips" radius={[0,4,4,0]} name="Trips">
          {d.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} fillOpacity={0.85}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
