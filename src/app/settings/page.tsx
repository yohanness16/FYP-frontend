"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { MLStatus } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Brain, Play, Trash2, Zap, Database, CheckCircle, XCircle, Info, Clock, RefreshCw } from "lucide-react";

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, animation: "slideUp 0.25s ease", background: type === "success" ? "var(--green-dim)" : "var(--red-dim)", border: `1px solid ${type === "success" ? "var(--green-border)" : "var(--red-border)"}`, color: type === "success" ? "var(--green)" : "var(--red)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}{msg}
    </div>
  );
}

export default function SettingsPage() {
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [useMl, setUseMl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, cfg] = await Promise.allSettled([adminApi.mlStatus(), adminApi.getSettings()]);
      if (s.status === "fulfilled") setMlStatus(s.value.data);
      if (cfg.status === "fulfilled") setUseMl(cfg.value.data.use_ml_for_prod);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTrain = async () => {
    setTraining(true);
    try { const r = await adminApi.trainModel(); showToast(r.data.message || "Model trained successfully", "success"); await load(); }
    catch (e: unknown) { showToast((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Training failed", "error"); }
    finally { setTraining(false); }
  };

  const handleCleanup = async () => {
    if (!confirm("Run data cleanup? This cannot be undone.")) return;
    setCleaning(true);
    try { const r = await adminApi.cleanup(); showToast(`Deleted ${r.data.raw_telemetry_deleted} telemetry + ${r.data.trip_history_deleted} history records`, "success"); }
    catch { showToast("Cleanup failed", "error"); }
    finally { setCleaning(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { const n = !useMl; await adminApi.updateSettings(n); setUseMl(n); showToast(`Switched to ${n ? "ML Model" : "Heuristic Algorithm"}`, "success"); }
    catch { showToast("Failed to update setting", "error"); }
    finally { setToggling(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Settings & ML</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Model training, ETA mode, and data retention</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={14} />Refresh</button>
      </div>

      {/* ML Status */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Brain size={15} color="var(--neon)" />
          <span className="section-title">ML Model Status</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: mlStatus?.model_loaded ? "var(--green-dim)" : "var(--red-dim)", border: `1px solid ${mlStatus?.model_loaded ? "var(--green-border)" : "var(--red-border)"}` }}>
              {mlStatus?.model_loaded ? <CheckCircle size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{mlStatus?.model_loaded ? "Model ready" : "No model found"}</p>
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
            <Info size={13} />Minimum 50 trip history records required. Run buses with active assignments first.
          </div>
        )}
      </div>

      {/* ETA Mode */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={15} color="var(--amber)" />
          <span className="section-title">ETA Mode</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{useMl ? "ML Model (RandomForest)" : "Heuristic Algorithm"}</p>
            <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{useMl ? "Trained model predicts ETA from historical patterns" : "Haversine + peak multipliers + dwell time formula"}</p>
          </div>
          <button onClick={handleToggle} disabled={toggling || (!mlStatus?.model_loaded && !useMl)} className={useMl ? "btn-primary" : "btn-secondary"} style={{ opacity: !mlStatus?.model_loaded && !useMl ? 0.4 : 1 }}>
            {toggling ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : null}
            {useMl ? "Active: ML" : "Switch to ML"}
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { title: "Heuristic", active: !useMl, pros: ["Works without data", "Predictable & explainable"], cons: ["Fixed peak-hour rules", "Cannot learn patterns"] },
            { title: "ML Model", active: useMl, pros: ["Learns from real trips", "Improves over time"], cons: ["Needs 50+ samples", "Requires retraining"] },
          ].map(m => (
            <div key={m.title} style={{ borderRadius: 9, padding: "12px", background: "var(--bg-3)", border: `1px solid ${m.active ? "var(--neon-border)" : "var(--border)"}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {m.active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />}{m.title}
              </p>
              {m.pros.map(p => <p key={p} style={{ fontSize: 11.5, color: "var(--green)", marginBottom: 2 }}>✓ {p}</p>)}
              {m.cons.map(c => <p key={c} style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 2 }}>✗ {c}</p>)}
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Database size={15} color="var(--red)" />
          <span className="section-title">Data Retention & Cleanup</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { icon: <Clock size={14} />, label: "Raw Telemetry", val: "30 days", desc: "GPS pings" },
            { icon: <Brain size={14} />, label: "Trip History", val: "365 days", desc: "ML training data" },
          ].map(r => (
            <div key={r.label} style={{ borderRadius: 9, padding: "12px", background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, color: "var(--text-3)" }}>{r.icon}<span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{r.label}</span></div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>{r.val}</p>
              <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{r.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 9, background: "var(--red-dim)", border: "1px solid var(--red-border)" }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>Run Data Cleanup</p>
            <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Deletes records older than retention thresholds. Cannot be undone.</p>
          </div>
          <button onClick={handleCleanup} disabled={cleaning} className="btn-danger" style={{ flexShrink: 0 }}>
            {cleaning ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--red)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
            {cleaning ? "Running…" : "Run Cleanup"}
          </button>
        </div>
      </div>

      {/* API info */}
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
