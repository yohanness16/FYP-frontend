import { Cpu, Signal, Clock, Hash } from "lucide-react";

interface DeviceStatusProps {
    deviceId: string;
    lastTelemetryAt: string | null;
    busType: string | null;
    isOnline: boolean;
}

export function DeviceStatus({ deviceId, lastTelemetryAt, busType, isOnline }: DeviceStatusProps) {
    const timeSince = lastTelemetryAt
        ? Math.round((Date.now() - new Date(lastTelemetryAt).getTime()) / 1000)
        : null;

    const lastSeenLabel =
        timeSince !== null
            ? timeSince < 60
                ? `${timeSince}s ago`
                : timeSince < 3600
                    ? `${Math.round(timeSince / 60)}m ago`
                    : `${Math.round(timeSince / 3600)}h ago`
            : "Never";

    return (
        <div className="card-glow p-5">
            <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-4 w-4" style={{ color: "var(--text3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    IoT Device
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: isOnline ? "var(--neon)" : "var(--danger)",
                            boxShadow: isOnline ? "var(--glow-neon)" : "none",
                        }}
                    />
                    <span
                        className="text-[10px] font-bold"
                        style={{ color: isOnline ? "var(--neon)" : "var(--danger)" }}
                    >
                        {isOnline ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--bg3)" }}>
                    <Hash className="h-4 w-4 shrink-0" style={{ color: "var(--neon-b)" }} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase" style={{ color: "var(--text3)" }}>Device ID (IMEI)</p>
                        <p className="text-xs font-mono font-semibold truncate" style={{ color: "var(--text)" }}>
                            {deviceId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--bg3)" }}>
                    <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--neon-p)" }} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase" style={{ color: "var(--text3)" }}>Last Telemetry</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{lastSeenLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--bg3)" }}>
                    <Signal className="h-4 w-4 shrink-0" style={{ color: "var(--neon-y)" }} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase" style={{ color: "var(--text3)" }}>Bus Type</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{busType || "Unknown"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
