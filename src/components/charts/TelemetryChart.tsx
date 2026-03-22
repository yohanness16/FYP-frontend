"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "@/types";

export function TelemetryChart({ data }: { data: ChartData }) {
  const d = data.labels.map((l,i) => ({ hour: l.slice(11,16)||l, pings: data.data[i] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={d} margin={{ top:4, right:4, left:-24, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
        <XAxis dataKey="hour" tick={{ fill:"var(--text-muted)", fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} itemStyle={{ color:"var(--brand)" }} labelStyle={{ color:"var(--text-secondary)" }}/>
        <Bar dataKey="pings" fill="#2f81f7" fillOpacity={0.85} radius={[3,3,0,0]} name="GPS Pings"/>
      </BarChart>
    </ResponsiveContainer>
  );
}
