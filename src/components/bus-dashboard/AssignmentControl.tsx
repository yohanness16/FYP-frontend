import { useState } from "react";
import { Play, Square, Route } from "lucide-react";

interface RouteOption {
    id: number;
    route_number: string;
    name: string;
}

interface AssignmentControlProps {
    currentAssignment: {
        id: number;
        route_number: string;
        status: string;
    } | null;
    driverId: number;
    vehicleId: number;
    routes: RouteOption[];
    onStartAssignment: (routeId: number) => Promise<void>;
    onEndAssignment: (assignmentId: number) => Promise<void>;
}

export function AssignmentControl({
    currentAssignment,
    driverId,
    vehicleId,
    routes,
    onStartAssignment,
    onEndAssignment,
}: AssignmentControlProps) {
    const [selectedRouteId, setSelectedRouteId] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStart = async () => {
        if (!selectedRouteId) return;
        setLoading(true);
        setError("");
        try {
            await onStartAssignment(Number(selectedRouteId));
            setSelectedRouteId("");
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || "Failed to start assignment");
        } finally {
            setLoading(false);
        }
    };

    const handleEnd = async () => {
        if (!currentAssignment) return;
        setLoading(true);
        setError("");
        try {
            await onEndAssignment(currentAssignment.id);
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || "Failed to end assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-glow p-5">
            <div className="flex items-center gap-2 mb-4">
                <Route className="h-4 w-4" style={{ color: "var(--text3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    Assignment Control
                </span>
            </div>

            {currentAssignment ? (
                <div className="space-y-3">
                    <div
                        className="p-3 rounded-lg flex items-center justify-between"
                        style={{ background: "var(--neon-dim)", border: "1px solid var(--border2)" }}
                    >
                        <div>
                            <p className="text-xs" style={{ color: "var(--text3)" }}>Active Route</p>
                            <p className="text-lg font-bold" style={{ color: "var(--neon)" }}>
                                {currentAssignment.route_number}
                            </p>
                        </div>
                        <span className="badge badge-green">Active</span>
                    </div>
                    <button
                        className="btn-danger w-full justify-center"
                        onClick={handleEnd}
                        disabled={loading}
                    >
                        <Square className="h-4 w-4" />
                        {loading ? "Ending..." : "End Assignment"}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="label">Select Route</label>
                        <select
                            className="input"
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">-- Choose a route --</option>
                            {routes.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.route_number} — {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn-primary w-full justify-center"
                        onClick={handleStart}
                        disabled={loading || !selectedRouteId}
                    >
                        <Play className="h-4 w-4" />
                        {loading ? "Starting..." : "Start Assignment"}
                    </button>
                </div>
            )}

            {error && (
                <div
                    className="mt-3 p-2.5 rounded-lg text-xs"
                    style={{ background: "var(--neon-r-dim)", color: "var(--danger)", border: "1px solid rgba(255,34,85,0.3)" }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}
