import { History, Clock } from "lucide-react";

interface TripEntry {
    id: number;
    stopName: string;
    arrivalTime: string;
    dwellTime: number | null;
    occupancyLevel: number | null;
}

interface TripHistoryTableProps {
    entries: TripEntry[];
}

const OCC_BADGE: Record<number, string> = {
    0: "badge-green",
    1: "badge-amber",
    2: "badge-red",
};
const OCC_LABEL: Record<number, string> = {
    0: "Low",
    1: "Medium",
    2: "High",
};

export function TripHistoryTable({ entries }: TripHistoryTableProps) {
    return (
        <div className="card-glow p-5">
            <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4" style={{ color: "var(--text3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    Trip History
                </span>
                <span className="ml-auto badge badge-gray">{entries.length} stops</span>
            </div>

            {entries.length > 0 ? (
                <div className="tbl-wrap" style={{ maxHeight: 280, overflowY: "auto" }}>
                    <table className="w-full text-left">
                        <thead className="tbl-head sticky top-0 z-10">
                            <tr>
                                <th className="tbl-th">Stop</th>
                                <th className="tbl-th">Arrived</th>
                                <th className="tbl-th">Dwell</th>
                                <th className="tbl-th">Density</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="tbl-row">
                                    <td className="tbl-td">
                                        <span className="font-medium" style={{ color: "var(--text)" }}>{entry.stopName}</span>
                                    </td>
                                    <td className="tbl-td">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" style={{ color: "var(--text3)" }} />
                                            <span style={{ color: "var(--text2)" }}>
                                                {new Date(entry.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="tbl-td">
                                        <span style={{ color: "var(--text2)" }}>
                                            {entry.dwellTime !== null ? `${entry.dwellTime}s` : "--"}
                                        </span>
                                    </td>
                                    <td className="tbl-td">
                                        {entry.occupancyLevel !== null ? (
                                            <span className={`badge ${OCC_BADGE[entry.occupancyLevel] || "badge-gray"}`}>
                                                {OCC_LABEL[entry.occupancyLevel] || "N/A"}
                                            </span>
                                        ) : (
                                            <span className="badge badge-gray">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-8 text-center">
                    <History className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text3)", opacity: 0.3 }} />
                    <p className="text-xs" style={{ color: "var(--text3)" }}>No trip history yet</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text3)", opacity: 0.6 }}>
                        Stop arrivals will appear here during the trip
                    </p>
                </div>
            )}
        </div>
    );
}
