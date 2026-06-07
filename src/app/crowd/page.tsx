"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { crowdApi, vehiclesApi } from "@/lib/api";
import { CvData, Vehicle } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ScanEye, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/time";

type CrowdResponse = {
  plate_number: string;
  cv?: CvData & { occupancy_level?: number; face_count?: number; head_blob_count?: number; updated_at?: string };
};

export default function CrowdPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [plate, setPlate] = useState("");
  const [data, setData] = useState<CrowdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    vehiclesApi.list(0, 200)
      .then((res) => { const list = Array.isArray(res.data) ? (res.data as Vehicle[]) : []; setVehicles(list); if (list[0]?.plate_number) setPlate(list[0].plate_number); })
      .finally(() => setLoading(false));
  }, []);

  const loadCrowd = useCallback(async (targetPlate: string) => {
    if (!targetPlate) return;
    setFetching(true); setError("");
    try { const res = await crowdApi.getByPlate(targetPlate); setData(res.data as CrowdResponse); }
    catch (err: unknown) { setData(null); setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "No CV data for this vehicle"); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { if (!loading && plate) void loadCrowd(plate); }, [loading, plate, loadCrowd]);

  const cv = data?.cv;
  const occupancyLabel = useMemo(() => { const level = cv?.occupancy_level; if (level === 0) return "Low"; if (level === 1) return "Medium"; if (level === 2) return "High"; return "Unknown"; }, [cv?.occupancy_level]);

  if (loading) return <PageLoader />;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const imageUrl = cv?.image_path ? (cv.image_path.startsWith("http") ? cv.image_path : `${apiBase}${cv.image_path.startsWith("/") ? "" : "/"}${cv.image_path}`) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Crowd Density</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest computer-vision occupancy per vehicle</p>
        </div>
        <button type="button" onClick={() => void loadCrowd(plate)} disabled={fetching} className="btn-secondary">
          <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />Refresh
        </button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="label" htmlFor="plate-select">Vehicle plate</label>
            <select id="plate-select" className="input w-full" value={plate} onChange={(e) => setPlate(e.target.value)}>
              {vehicles.map((v) => (<option key={v.id} value={v.plate_number}>{v.plate_number}</option>))}
            </select>
          </div>
          <button type="button" className="btn-primary h-9" onClick={() => void loadCrowd(plate)} disabled={fetching}>
            <ScanEye size={14} />Load CV result
          </button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="flex items-center gap-2 pt-3 pb-3 text-sm text-destructive">
            <AlertCircle size={15} />{error}
          </CardContent>
        </Card>
      )}

      {cv && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Latest capture</CardTitle></CardHeader>
            <CardContent>
              {imageUrl ? (
                <img src={imageUrl} alt={`Crowd capture for ${data?.plate_number}`} className="max-h-[420px] w-full rounded-lg border border-border object-contain bg-black/5" />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">No image available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">CV metrics — {data?.plate_number}</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Occupancy", occupancyLabel],
                  ["People count", cv.people_count ?? "—"],
                  ["Crowd density", cv.crowd_density != null ? cv.crowd_density.toFixed(2) : "—"],
                  ["Confidence", cv.confidence != null ? `${Math.round(cv.confidence * 100)}%` : "—"],
                  ["Method", cv.method ?? "—"],
                  ["Crowded", cv.is_crowded ? "Yes" : "No"],
                  ["Updated", cv.updated_at ? formatDateTime(new Date(cv.updated_at)) : "—"],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label as string}</dt>
                    <dd className="mt-1 font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
