import { Users } from "lucide-react";

interface OccupancyGaugeProps {
    level: number; // 0, 1, 2
    passengerCount: number;
    capacity: number | null;
    confidence: number;
    method: string;
}

const LEVEL_CONFIG = [
    { label: "Low", color: "var(--neon)", gradient: "conic-gradient(from 220deg, #00ff88 0deg, #00ff88 100deg, transparent 100deg)" },
    { label: "Medium", color: "var(--warning)", gradient: "conic-gradient(from 220deg, #ffb800 0deg, #ffb800 180deg, transparent 180deg)" },
    { label: "High", color: "var(--danger)", gradient: "conic-gradient(from 220deg, #ff2255 0deg, #ff2255 260deg, transparent 260deg)" },
];

export function OccupancyGauge({ level, passengerCount, capacity, confidence, method }: OccupancyGaugeProps) {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];
    const loadPercent = capacity && capacity > 0 ? Math.min(100, Math.round((passengerCount / capacity) * 100)) : null;

    return (
        <div className="card-glow p-5">
            <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" style={{ color: "var(--text3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    Passenger Density
                </span>
            </div>

            <div className="flex items-center gap-6">
                {/* Gauge ring */}
                <div className="relative w-28 h-28 shrink-0">
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: config.gradient,
                            mask: "radial-gradient(farthest-side, transparent calc(100% - 10px), #fff calc(100% - 9px))",
                            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 10px), #fff calc(100% - 9px))",
                            transition: "all 0.6s ease",
                        }}
                    />
                    <div
                        className="absolute inset-[10px] rounded-full flex flex-col items-center justify-center"
                        style={{ background: "var(--surface)" }}
                    >
                        <span className="text-2xl font-bold" style={{ color: config.color }}>
                            {config.label}
                        </span>
                        {loadPercent !== null && (
                            <span className="text-[10px] font-medium" style={{ color: "var(--text3)" }}>
                                {loadPercent}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text3)" }}>Passengers</span>
                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{passengerCount}</span>
                    </div>
                    {capacity && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: "var(--text3)" }}>Capacity</span>
                            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{capacity}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text3)" }}>CV Method</span>
                        <span className="badge badge-blue">{method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text3)" }}>Confidence</span>
                        <span className="text-sm font-semibold" style={{ color: "var(--text2)" }}>
                            {Math.round(confidence * 100)}%
                        </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg4)" }}>
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.round(confidence * 100)}%`, background: config.color }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
