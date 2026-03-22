import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: "blue" | "green" | "amber" | "red" | "purple";
  trend?: { value: string; up: boolean };
}

const ACCENT = {
  blue:   { bg: "var(--brand-subtle)",   color: "var(--brand)",   border: "var(--brand-border)" },
  green:  { bg: "var(--success-subtle)", color: "var(--success)",  border: "rgba(63,185,80,0.3)" },
  amber:  { bg: "var(--warning-subtle)", color: "var(--warning)",  border: "rgba(210,153,34,0.3)" },
  red:    { bg: "var(--danger-subtle)",  color: "var(--danger)",   border: "rgba(248,81,73,0.3)" },
  purple: { bg: "rgba(139,92,246,0.1)",  color: "#a78bfa",         border: "rgba(139,92,246,0.3)" },
};

export function StatCard({ title, value, subtitle, icon, accent = "blue", trend }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:"var(--text-muted)" }}>{title}</p>
          <p className="mt-2 text-[28px] font-bold tracking-tight" style={{ color:"var(--text-primary)", lineHeight:1 }}>{value}</p>
          {subtitle && <p className="mt-1.5 text-[12px]" style={{ color:"var(--text-muted)" }}>{subtitle}</p>}
          {trend && (
            <p className="mt-1.5 text-[12px] font-semibold flex items-center gap-1" style={{ color: trend.up ? "var(--success)" : "var(--danger)" }}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{ background: a.bg, color: a.color, border: `1px solid ${a.border}` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
