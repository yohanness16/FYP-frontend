import { MapPin, Navigation } from "lucide-react";

interface Stop {
    id: number;
    name: string;
    lat: number;
    lon: number;
}

interface RouteProgressProps {
    routeNumber: string | null;
    routeName: string | null;
    origin: string | null;
    destination: string | null;
    stops: Stop[];
    nearestStopIndex: number;
}

export function RouteProgress({
    routeNumber,
    routeName,
    origin,
    destination,
    stops,
    nearestStopIndex,
}: RouteProgressProps) {
    return (
        <div className="card-glow p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" style={{ color: "var(--text3)" }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        Route Progress
                    </span>
                </div>
                {routeNumber && <span className="badge badge-green">{routeNumber}</span>}
            </div>

            {/* Route name and origin/destination */}
            {routeName && (
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{routeName}</p>
            )}
            {origin && destination && (
                <p className="text-xs mb-4" style={{ color: "var(--text3)" }}>
                    {origin} → {destination}
                </p>
            )}

            {/* Stop timeline */}
            {stops.length > 0 ? (
                <div className="space-y-0 max-h-[300px] overflow-y-auto pr-2">
                    {stops.map((stop, idx) => {
                        const isPassed = idx < nearestStopIndex;
                        const isCurrent = idx === nearestStopIndex;
                        const isFuture = idx > nearestStopIndex;

                        return (
                            <div key={stop.id} className="flex items-start gap-3 relative">
                                {/* Vertical line */}
                                <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                                    <div
                                        className="w-3 h-3 rounded-full border-2 z-10 shrink-0"
                                        style={{
                                            borderColor: isCurrent ? "var(--neon)" : isPassed ? "var(--neon)" : "var(--border2)",
                                            background: isCurrent ? "var(--neon)" : isPassed ? "var(--neon-dim)" : "var(--bg2)",
                                            boxShadow: isCurrent ? "var(--glow-neon)" : "none",
                                        }}
                                    />
                                    {idx < stops.length - 1 && (
                                        <div
                                            className="w-0.5 flex-1 min-h-[24px]"
                                            style={{
                                                background: isPassed ? "var(--neon)" : "var(--border)",
                                                opacity: isPassed ? 0.5 : 0.3,
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Stop info */}
                                <div className="pb-4 min-w-0 flex-1">
                                    <p
                                        className="text-sm font-medium leading-tight"
                                        style={{ color: isCurrent ? "var(--neon)" : isPassed ? "var(--text2)" : "var(--text3)" }}
                                    >
                                        {stop.name}
                                        {isCurrent && (
                                            <span
                                                className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                                                style={{ background: "var(--neon-dim)", color: "var(--neon)" }}
                                            >
                                                CURRENT
                                            </span>
                                        )}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text3)" }}>
                                            <MapPin className="inline h-3 w-3 mr-0.5" />
                                            {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text3)", opacity: 0.4 }} />
                    <p className="text-xs" style={{ color: "var(--text3)" }}>No route assigned</p>
                </div>
            )}
        </div>
    );
}
