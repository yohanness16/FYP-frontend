import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
  trend?: { value: string; up: boolean };
}

export function StatCard({ title, value, subtitle, icon, color = "var(--neon)", trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color:"var(--text3)" }}>{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color, border:`1px solid ${color}30` }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1" style={{ color, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>
        {value}
      </p>
      {subtitle && <p className="text-[11px]" style={{ color:"var(--text3)" }}>{subtitle}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold"
          style={{ color: trend.up ? "var(--neon)" : "var(--danger)" }}>
          <span>{trend.up ? "▲" : "▼"}</span>{trend.value}
        </div>
      )}
    </div>
  );
}
