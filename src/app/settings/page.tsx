"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { EtaPreviewResult, MLStatus } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, CheckCircle, Clock, Database, Info, Play, RefreshCw, Target, Trash2, XCircle, Zap, AlertCircle,
} from "lucide-react";
import { formatDateTime, getLocalTimeZone } from "@/lib/time";

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-[76px] right-4 z-80 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg animate-fade-up ${type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400" : "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"}`}>
      {type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}{msg}
    </div>
  );
}

const previewDefaults = { lat1: "9.035", lon1: "38.76", lat2: "9.03", lon2: "38.78", num_stops: "4", base_dwell_time: "30", stop_id: "", occupancy_level: "0" };

export default function SettingsPage() {
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [useMl, setUseMl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<Partial<EtaPreviewResult> | null>(null);
  const [previewForm, setPreviewForm] = useState(previewDefaults);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [opLog, setOpLog] = useState<Array<{ ts: string; action: string; output: string; type: "success" | "error" }>>([]);

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });
  const pushLog = (action: string, output: string, type: "success" | "error") => setOpLog((prev) => [{ ts: formatDateTime(new Date()), action, output, type }, ...prev].slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try { const [sr, sfr] = await Promise.allSettled([adminApi.mlStatus(), adminApi.getSettings()]); if (sr.status === "fulfilled") setMlStatus(sr.value.data); if (sfr.status === "fulfilled") setUseMl(sfr.value.data.use_ml_for_prod); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleTrain = async () => {
    setTraining(true);
    try { const r = await adminApi.trainModel(); showToast(r.data.message || "Model trained successfully", "success"); pushLog("Train Model", r.data.message || "Success", "success"); await load(); }
    catch (e: unknown) { const m = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Training failed"; showToast(m, "error"); pushLog("Train Model", m, "error"); }
    finally { setTraining(false); }
  };

  const handleCleanup = async () => {
    if (!confirm("Run data cleanup? This cannot be undone.")) return;
    setCleaning(true);
    try { const r = await adminApi.cleanup(); const m = `Deleted ${r.data.raw_telemetry_deleted} telemetry + ${r.data.trip_history_deleted} history records`; showToast(m, "success"); pushLog("Run Cleanup", m, "success"); }
    catch { showToast("Cleanup failed", "error"); pushLog("Run Cleanup", "Cleanup failed", "error"); }
    finally { setCleaning(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { const nv = !useMl; await adminApi.updateSettings(nv); setUseMl(nv); const m = `Switched to ${nv ? "ML Model" : "Heuristic Algorithm"}`; showToast(m, "success"); pushLog("Update ETA Mode", m, "success"); }
    catch { showToast("Failed to update setting", "error"); pushLog("Update ETA Mode", "Failed to update setting", "error"); }
    finally { setToggling(false); }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const r = await adminApi.etaPreview({ lat1: Number(previewForm.lat1), lon1: Number(previewForm.lon1), lat2: Number(previewForm.lat2), lon2: Number(previewForm.lon2), num_stops: Number(previewForm.num_stops || 0), base_dwell_time: Number(previewForm.base_dwell_time || 30), stop_id: previewForm.stop_id ? Number(previewForm.stop_id) : undefined, occupancy_level: Number(previewForm.occupancy_level || 0) });
      setPreview(r.data); pushLog("Run ETA Preview", `eta=${r.data.eta_seconds}s, heuristic=${r.data.heuristic_eta_seconds}s, mode=${r.data.mode}`, "success");
    } catch (e: unknown) { const m = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "ETA preview failed"; showToast(m, "error"); pushLog("Run ETA Preview", m, "error"); }
    finally { setPreviewing(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Settings & ML</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Model training, ETA mode, previews, and data retention</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Refresh</button>
      </div>

      {/* ML Model Status */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Brain size={15} className="text-primary" />ML Model Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mlStatus?.model_loaded ? "bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-red-100 border border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
                {mlStatus?.model_loaded ? <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" /> : <XCircle size={18} className="text-red-500 dark:text-red-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{mlStatus?.model_loaded ? "Model ready" : "No model found"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{mlStatus?.model_loaded ? `Version: ${mlStatus.model_version || "unknown"}` : "Train first to enable ML-based ETA"}</p>
              </div>
            </div>
            <button onClick={handleTrain} disabled={training} className="btn-primary text-xs h-8">
              {training ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : <><Play size={13} />Train Model</>}
            </button>
          </div>
          {!mlStatus?.model_loaded && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              <Info size={13} />Minimum 50 trip history records required. Run buses with active assignments first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ETA Mode */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap size={15} className="text-amber-500" />ETA Mode</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">{useMl ? "ML Model (RandomForest)" : "Heuristic Algorithm"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{useMl ? "Trained model predicts ETA from historical patterns" : "Haversine + peak multipliers + dwell time formula"}</p>
            </div>
            <button onClick={handleToggle} disabled={toggling || (!mlStatus?.model_loaded && !useMl)} className={`btn-primary text-xs h-8 ${!mlStatus?.model_loaded && !useMl ? "opacity-40" : ""}`}>
              {toggling ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : null}
              {useMl ? "Active: ML" : "Switch to ML"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ETA Preview */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target size={15} className="text-sky-500" />ETA Preview Sandbox</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="grid grid-cols-2 gap-3">
              {([["lat1", "Start latitude"], ["lon1", "Start longitude"], ["lat2", "End latitude"], ["lon2", "End longitude"]] as const).map(([key, label]) => (
                <div key={key}><label className="label">{label}</label><input className="input" type="number" step="any" value={previewForm[key as keyof typeof previewForm]} onChange={(e) => setPreviewForm((c) => ({ ...c, [key]: e.target.value }))} /></div>
              ))}
              <div><label className="label">Stops count</label><input className="input" type="number" min={0} value={previewForm.num_stops} onChange={(e) => setPreviewForm((c) => ({ ...c, num_stops: e.target.value }))} /></div>
              <div><label className="label">Base dwell time</label><input className="input" type="number" min={0} value={previewForm.base_dwell_time} onChange={(e) => setPreviewForm((c) => ({ ...c, base_dwell_time: e.target.value }))} /></div>
              <div><label className="label">Stop ID (optional)</label><input className="input" type="number" min={0} value={previewForm.stop_id} onChange={(e) => setPreviewForm((c) => ({ ...c, stop_id: e.target.value }))} /></div>
              <div>
                <label className="label">Occupancy level</label>
                <select className="input" value={previewForm.occupancy_level} onChange={(e) => setPreviewForm((c) => ({ ...c, occupancy_level: e.target.value }))}>
                  <option value="0">0 - Low</option><option value="1">1 - Medium</option><option value="2">2 - High</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Result</p>
                {preview ? (<>
                  <p className="text-3xl font-bold font-display text-sky-500 tracking-tight">{preview.eta_seconds}s</p>
                  <p className="text-xs text-muted-foreground mt-1">Heuristic: {preview.heuristic_eta_seconds}s</p>
                  <p className="text-xs text-muted-foreground mt-1">Mode: {preview.mode}</p>
                </>) : (<p className="text-sm text-muted-foreground">Run a preview to compare heuristic and ML estimates.</p>)}
              </div>
              <button onClick={handlePreview} disabled={previewing} className="btn-primary justify-center h-9">
                {previewing ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : <><Target size={13} />Run ETA Preview</>}
              </button>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-400">
                <Info size={13} />ETA Preview simulates a trip with your inputs and shows the predicted ETA, heuristic baseline, and active mode.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operation Log */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Info size={15} className="text-violet-500" />Operation Output</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Time zone: {getLocalTimeZone()}</span>
          </div>
          {opLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">No actions yet. Training, mode switching, and preview results will appear here.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {opLog.map((row, idx) => (
                <div key={`${row.ts}-${idx}`} className={`rounded-lg p-2.5 border ${row.type === "success" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`}>
                  <div className="flex justify-between gap-3 flex-wrap">
                    <span className="text-xs text-foreground font-semibold">{row.action}</span>
                    <span className="text-[10px] text-muted-foreground">{row.ts}</span>
                  </div>
                  <p className={`mt-1 text-xs ${row.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{row.output}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Database size={15} className="text-red-500" />Data Retention & Cleanup</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[{ icon: <Clock size={14} />, label: "Raw Telemetry", val: "30 days", desc: "GPS pings" }, { icon: <Brain size={14} />, label: "Trip History", val: "365 days", desc: "ML training data" }].map((e) => (
              <div key={e.label} className="rounded-lg p-3 bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">{e.icon}<span className="text-[10px] font-bold uppercase tracking-wider">{e.label}</span></div>
                <p className="text-xl font-bold text-foreground font-display">{e.val}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
            <div>
              <p className="text-sm font-semibold text-foreground">Run Data Cleanup</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Deletes records older than retention thresholds. Cannot be undone.</p>
            </div>
            <button onClick={handleCleanup} disabled={cleaning} className="btn-danger text-xs h-8 shrink-0">
              {cleaning ? <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 inline-block animate-spin" /> : <><Trash2 size={13} />Run Cleanup</>}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Connected API</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <code className="font-mono text-sm text-foreground">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Smart Transport FastAPI v1.0 · PostgreSQL + Redis</p>
        </CardContent>
      </Card>
    </div>
  );
}
