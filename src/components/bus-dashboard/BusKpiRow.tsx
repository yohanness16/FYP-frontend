import { Gauge, Users, Clock, Zap } from "lucide-react";

interface BusKpiRowProps {
    speed: number;
    occupancyLevel: number;
    etaMinutes: number | null;
    passengerCount: number;
}

const OCCUPANCY_LABELS = ["Low", "Medium", "High"];
const OCCUPANCY_COLORS = ["var(--neon)", "var(--warning)", "var(--danger)"];

export function BusKpiRow({ speed, occupancyLevel, etaMinutes, passengerCount }: BusKpiRowProps) {
    const kpis = [
        {
            icon: Gauge,
            label: "Speed",
            value: `${Math.round(speed)}`,
            unit: "km/h",
            color: "var(--neon-b)",
            bg: "var(--neon-b-dim)",
        },
        {
            icon: Users,
            label: "Occupancy",
            value: OCCUPANCY_LABELS[occupancyLevel] || "N/A",
            unit: "",
            color: OCCUPANCY_COLORS[occupancyLevel] || "var(--text3)",
            bg: occupancyLevel === 2 ? "var(--neon-r-dim)" : occupancyLevel === 1 ? "rgba(255,184,0,0.1)" : "var(--neon-dim)",
        },
        {
            icon: Clock,
            label: "Next Stop ETA",
            value: etaMinutes !== null ? `${etaMinutes}` : "--",
            unit: etaMinutes !== null ? "min" : "",
            color: "var(--neon-p)",
            bg: "rgba(191,0,255,0.1)",
        },
        {
            icon: Zap,
            label: "Passengers",
            value: `${passengerCount}`,
            unit: "detected",
            color: "var(--neon-y)",
            bg: "rgba(255,238,0,0.08)",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="stat-card flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: kpi.bg }}
                    >
                        <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: "var(--text3)" }}>
                            {kpi.label}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold leading-tight" style={{ color: kpi.color }}>
                                {kpi.value}
                            </span>
                            {kpi.unit && (
                                <span className="text-[11px] font-medium" style={{ color: "var(--text3)" }}>
                                    {kpi.unit}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
