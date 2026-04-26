"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { EtaPreviewResult, MLStatus } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import {
  Brain,
  CheckCircle,
  Clock,
  Database,
  Info,
  Play,
  RefreshCw,
  Target,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        animation: "slideUp 0.25s ease",
        background: type === "success" ? "var(--green-dim)" : "var(--red-dim)",
        border: `1px solid ${type === "success" ? "var(--green-border)" : "var(--red-border)"}`,
        color: type === "success" ? "var(--green)" : "var(--red)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
      {msg}
    </div>
  );
}

const previewDefaults = {
  lat1: "9.035",
  lon1: "38.76",
  lat2: "9.03",
  lon2: "38.78",
  num_stops: "4",
  base_dwell_time: "30",
  stop_id: "",
  occupancy_level: "0",
};

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

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusResult, settingsResult] = await Promise.allSettled([adminApi.mlStatus(), adminApi.getSettings()]);
      if (statusResult.status === "fulfilled") setMlStatus(statusResult.value.data);
      if (settingsResult.status === "fulfilled") setUseMl(settingsResult.value.data.use_ml_for_prod);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const response = await adminApi.trainModel();
      showToast(response.data.message || "Model trained successfully", "success");
      await load();
    } catch (error: unknown) {
      showToast((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Training failed", "error");
    } finally {
      setTraining(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Run data cleanup? This cannot be undone.")) return;
    setCleaning(true);
    try {
      const response = await adminApi.cleanup();
      showToast(`Deleted ${response.data.raw_telemetry_deleted} telemetry + ${response.data.trip_history_deleted} history records`, "success");
    } catch {
      showToast("Cleanup failed", "error");
    } finally {
      setCleaning(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const nextValue = !useMl;
      await adminApi.updateSettings(nextValue);
      setUseMl(nextValue);
      showToast(`Switched to ${nextValue ? "ML Model" : "Heuristic Algorithm"}`, "success");
    } catch {
      showToast("Failed to update setting", "error");
    } finally {
      setToggling(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await adminApi.etaPreview({
        lat1: Number(previewForm.lat1),
        lon1: Number(previewForm.lon1),
        lat2: Number(previewForm.lat2),
        lon2: Number(previewForm.lon2),
        num_stops: Number(previewForm.num_stops || 0),
        base_dwell_time: Number(previewForm.base_dwell_time || 30),
        stop_id: previewForm.stop_id ? Number(previewForm.stop_id) : undefined,
        occupancy_level: Number(previewForm.occupancy_level || 0),
      });
      setPreview(response.data);
    } catch (error: unknown) {
      showToast((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "ETA preview failed", "error");
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 780 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Settings & ML</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Model training, ETA mode, previews, and data retention</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Refresh</button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Brain size={15} color="var(--neon)" />
          <span className="section-title">ML Model Status</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 14, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: mlStatus?.model_loaded ? "var(--green-dim)" : "var(--red-dim)", border: `1px solid ${mlStatus?.model_loaded ? "var(--green-border)" : "var(--red-border)"}` }}>
              {mlStatus?.model_loaded ? <CheckCircle size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{mlStatus?.model_loaded ? "Model ready" : "No model found"}</p>
              <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{mlStatus?.model_loaded ? `Version: ${mlStatus.model_version || "unknown"}` : "Train first to enable ML-based ETA"}</p>
            </div>
          </div>
          <button onClick={handleTrain} disabled={training} className="btn-primary">
            {training ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <Play size={13} />}
            {training ? "Training…" : "Train Model"}
          </button>
        </div>
        {!mlStatus?.model_loaded && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "var(--amber-dim)", border: "1px solid var(--amber-border)", color: "var(--amber)", fontSize: 12 }}>
            <Info size={13} />
            Minimum 50 trip history records required. Run buses with active assignments first.
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={15} color="var(--amber)" />
          <span className="section-title">ETA Mode</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 14, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{useMl ? "ML Model (RandomForest)" : "Heuristic Algorithm"}</p>
            <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{useMl ? "Trained model predicts ETA from historical patterns" : "Haversine + peak multipliers + dwell time formula"}</p>
          </div>
          <button onClick={handleToggle} disabled={toggling || (!mlStatus?.model_loaded && !useMl)} className={useMl ? "btn-primary" : "btn-secondary"} style={{ opacity: !mlStatus?.model_loaded && !useMl ? 0.4 : 1 }}>
            {toggling ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : null}
            {useMl ? "Active: ML" : "Switch to ML"}
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Target size={15} color="var(--cyan)" />
          <span className="section-title">ETA Preview Sandbox</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["lat1", "Start latitude"],
              ["lon1", "Start longitude"],
              ["lat2", "End latitude"],
              ["lon2", "End longitude"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" type="number" step="any" value={previewForm[key as keyof typeof previewForm]} onChange={(event) => setPreviewForm((current) => ({ ...current, [key]: event.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Stops count</label>
              <input className="input" type="number" min={0} value={previewForm.num_stops} onChange={(event) => setPreviewForm((current) => ({ ...current, num_stops: event.target.value }))} />
            </div>
            <div>
              <label className="label">Base dwell time</label>
              <input className="input" type="number" min={0} value={previewForm.base_dwell_time} onChange={(event) => setPreviewForm((current) => ({ ...current, base_dwell_time: event.target.value }))} />
            </div>
            <div>
              <label className="label">Stop ID (optional)</label>
              <input className="input" type="number" min={0} value={previewForm.stop_id} onChange={(event) => setPreviewForm((current) => ({ ...current, stop_id: event.target.value }))} />
            </div>
            <div>
              <label className="label">Occupancy level</label>
              <select className="input" value={previewForm.occupancy_level} onChange={(event) => setPreviewForm((current) => ({ ...current, occupancy_level: event.target.value }))}>
                <option value="0">0 - Low</option>
                <option value="1">1 - Medium</option>
                <option value="2">2 - High</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: 8 }}>Result</p>
              {preview ? (
                <>
                  <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--cyan)", letterSpacing: "-0.04em" }}>{preview.eta_seconds}s</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Heuristic: {preview.heuristic_eta_seconds}s</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Mode: {preview.mode}</p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>Run a preview to compare heuristic and ML estimates.</p>
              )}
            </div>
            <button onClick={handlePreview} disabled={previewing} className="btn-primary" style={{ justifyContent: "center" }}>
              {previewing ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <Target size={13} />}
              {previewing ? "Previewing…" : "Run ETA Preview"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "var(--cyan-dim)", border: "1px solid var(--cyan-border)", color: "var(--cyan)", fontSize: 12 }}>
              <Info size={13} />
              This calls the backend preview endpoint and uses the runtime ML toggle.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Database size={15} color="var(--red)" />
          <span className="section-title">Data Retention & Cleanup</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { icon: <Clock size={14} />, label: "Raw Telemetry", val: "30 days", desc: "GPS pings" },
            { icon: <Brain size={14} />, label: "Trip History", val: "365 days", desc: "ML training data" },
          ].map((entry) => (
            <div key={entry.label} style={{ borderRadius: 9, padding: 12, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, color: "var(--text-3)" }}>
                {entry.icon}
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{entry.label}</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>{entry.val}</p>
              <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{entry.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 9, background: "var(--red-dim)", border: "1px solid var(--red-border)" }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Run Data Cleanup</p>
            <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Deletes records older than retention thresholds. Cannot be undone.</p>
          </div>
          <button onClick={handleCleanup} disabled={cleaning} className="btn-danger" style={{ flexShrink: 0 }}>
            {cleaning ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--red)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
            {cleaning ? "Running…" : "Run Cleanup"}
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Connected API</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>Smart Transport FastAPI v1.0 · PostgreSQL + Redis</p>
      </div>
    </div>
  );
}
