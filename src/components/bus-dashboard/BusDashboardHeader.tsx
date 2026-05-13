import { Bus, LogOut, Wifi, WifiOff } from "lucide-react";

interface BusDashboardHeaderProps {
    plateNumber: string;
    routeNumber: string | null;
    driverName: string | null;
    isOnline: boolean;
    onLogout: () => void;
}

export function BusDashboardHeader({
    plateNumber,
    routeNumber,
    driverName,
    isOnline,
    onLogout,
}: BusDashboardHeaderProps) {
    return (
        <header
            className="flex items-center justify-between px-5 py-3 sticky top-0 z-50"
            style={{
                background: "var(--bg2)",
                borderBottom: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Left: Bus identity */}
            <div className="flex items-center gap-4">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, var(--neon-dim), transparent)",
                        border: "1px solid var(--border2)",
                    }}
                >
                    <Bus className="h-5 w-5" style={{ color: "var(--neon)" }} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold" style={{ color: "var(--text)" }}>
                            {plateNumber}
                        </h1>
                        {routeNumber && (
                            <span className="badge badge-green">{routeNumber}</span>
                        )}
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text3)" }}>
                        {driverName ? `Driver: ${driverName}` : "Bus Dashboard"}
                    </p>
                </div>
            </div>

            {/* Right: Connection + Logout */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg3)" }}>
                    {isOnline ? (
                        <>
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: "var(--neon)", boxShadow: "var(--glow-neon)", animation: "pulseGlow 2s infinite" }}
                            />
                            <Wifi className="h-3.5 w-3.5" style={{ color: "var(--neon)" }} />
                            <span className="text-[11px] font-semibold" style={{ color: "var(--neon)" }}>LIVE</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full" style={{ background: "var(--danger)" }} />
                            <WifiOff className="h-3.5 w-3.5" style={{ color: "var(--danger)" }} />
                            <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>OFFLINE</span>
                        </>
                    )}
                </div>
                <button className="btn-danger" style={{ padding: "6px 12px" }} onClick={onLogout}>
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}
