"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { MLStatus } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";

const BrainIcon   = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const PlayIcon    = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const TrashIcon   = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const ZapIcon     = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const DbIcon      = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const CheckIcon   = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon       = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const InfoIcon    = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const ClockIcon   = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const RefreshIcon = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

function Toast({ msg, type, onClose }: { msg:string; type:"success"|"error"; onClose:()=>void }) {
  useEffect(()=>{ const t=setTimeout(onClose,3500); return ()=>clearTimeout(t); },[onClose]);
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl animate-slide-up text-sm font-medium"
      style={{ background:type==="success"?"var(--success-subtle)":"var(--danger-subtle)", border:`1px solid ${type==="success"?"rgba(63,185,80,0.3)":"rgba(248,81,73,0.3)"}`, color:type==="success"?"var(--success)":"var(--danger)" }}>
      {type==="success"?<CheckIcon/>:<XIcon/>}{msg}
    </div>
  );
}

export default function SettingsPage() {
  const [mlStatus, setMlStatus] = useState<MLStatus|null>(null);
  const [useMl, setUseMl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:"success"|"error"}|null>(null);

  const showToast = (msg:string,type:"success"|"error")=>setToast({msg,type});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s,cfg] = await Promise.allSettled([adminApi.mlStatus(), adminApi.getSettings()]);
      if (s.status==="fulfilled") setMlStatus(s.value.data);
      if (cfg.status==="fulfilled") setUseMl(cfg.value.data.use_ml_for_prod);
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const handleTrain = async () => {
    setTraining(true);
    try { const r=await adminApi.trainModel(); showToast(r.data.message||"Model trained successfully","success"); await load(); }
    catch(e:unknown){ showToast((e as {response?:{data?:{detail?:string}}})?.response?.data?.detail||"Training failed","error"); }
    finally { setTraining(false); }
  };

  const handleCleanup = async () => {
    if (!confirm("Run data cleanup? This cannot be undone.")) return;
    setCleaning(true);
    try { const r=await adminApi.cleanup(); showToast(`Deleted ${r.data.raw_telemetry_deleted} telemetry + ${r.data.trip_history_deleted} history records`,"success"); }
    catch{ showToast("Cleanup failed","error"); }
    finally { setCleaning(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { const n=!useMl; await adminApi.updateSettings(n); setUseMl(n); showToast(`Switched to ${n?"ML Model":"Heuristic Algorithm"}`,"success"); }
    catch{ showToast("Failed to update setting","error"); }
    finally { setToggling(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>Settings & ML</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>Model training, ETA mode, and data retention</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshIcon />Refresh</button>
      </div>

      {/* ML Status */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4" style={{ color:"var(--brand)" }}><BrainIcon /><span className="section-title" style={{ color:"var(--text-primary)" }}>ML Model Status</span></div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background:"var(--bg-base)", border:"1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:mlStatus?.model_loaded?"var(--success-subtle)":"var(--danger-subtle)", color:mlStatus?.model_loaded?"var(--success)":"var(--danger)" }}>
              {mlStatus?.model_loaded?<CheckIcon/>:<XIcon/>}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{mlStatus?.model_loaded?"Model ready":"No model found"}</p>
              <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{mlStatus?.model_loaded?`Version: ${mlStatus.model_version||"unknown"}`:"Train first to enable ML-based ETA"}</p>
            </div>
          </div>
          <button onClick={handleTrain} disabled={training} className="btn-primary">
            {training?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<PlayIcon/>}
            {training?"Training…":"Train Model"}
          </button>
        </div>
        {!mlStatus?.model_loaded && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background:"var(--warning-subtle)", border:"1px solid rgba(210,153,34,0.2)", color:"var(--warning)" }}>
            <InfoIcon /><span>Minimum 50 trip history records required. Run buses with active assignments first.</span>
          </div>
        )}
      </div>

      {/* ETA Mode */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4" style={{ color:"var(--warning)" }}><ZapIcon /><span className="section-title" style={{ color:"var(--text-primary)" }}>ETA Mode</span></div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background:"var(--bg-base)", border:"1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{useMl?"ML Model (RandomForest)":"Heuristic Algorithm"}</p>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{useMl?"Trained model predicts ETA from historical patterns":"Haversine + peak multipliers + dwell time formula"}</p>
          </div>
          <button onClick={handleToggle} disabled={toggling||(!mlStatus?.model_loaded&&!useMl)}
            className={useMl?"btn-primary":"btn-secondary"}
            style={!useMl?{ opacity: (!mlStatus?.model_loaded&&!useMl)?0.4:1 }:{}}>
            {toggling?<span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>:null}
            {useMl?"Active: ML Model":"Switch to ML"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { title:"Heuristic", active:!useMl, pros:["Works without data","Predictable & explainable"], cons:["Fixed peak-hour rules","Cannot learn patterns"] },
            { title:"ML Model",  active:useMl,  pros:["Learns from real trips","Improves over time"], cons:["Needs 50+ samples","Requires retraining"] },
          ].map(m=>(
            <div key={m.title} className="rounded-xl p-3 text-xs" style={{ background:"var(--bg-base)", border:`1px solid ${m.active?"var(--brand-border)":"var(--border)"}` }}>
              <p className="font-semibold mb-2 flex items-center gap-1.5" style={{ color:"var(--text-primary)" }}>
                {m.active && <span className="w-1.5 h-1.5 rounded-full" style={{ background:"var(--success)" }}/>}{m.title}
              </p>
              {m.pros.map(p=><p key={p} style={{ color:"var(--success)" }}>✓ {p}</p>)}
              {m.cons.map(c=><p key={c} style={{ color:"var(--text-muted)" }}>✗ {c}</p>)}
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4" style={{ color:"var(--danger)" }}><DbIcon /><span className="section-title" style={{ color:"var(--text-primary)" }}>Data Retention & Cleanup</span></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { icon:<ClockIcon/>, label:"Raw Telemetry", val:"30 days", desc:"GPS pings retention" },
            { icon:<BrainIcon/>, label:"Trip History",  val:"365 days", desc:"ML training data" },
          ].map(r=>(
            <div key={r.label} className="rounded-xl p-4" style={{ background:"var(--bg-base)", border:"1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2" style={{ color:"var(--text-muted)" }}>{r.icon}<span className="text-xs font-medium">{r.label}</span></div>
              <p className="text-xl font-bold" style={{ color:"var(--text-primary)" }}>{r.val}</p>
              <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background:"var(--danger-subtle)", border:"1px solid rgba(248,81,73,0.2)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>Run Data Cleanup</p>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>Deletes records older than retention thresholds. Cannot be undone.</p>
          </div>
          <button onClick={handleCleanup} disabled={cleaning} className="btn-danger flex-shrink-0">
            {cleaning?<span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>:<TrashIcon/>}
            {cleaning?"Running…":"Run Cleanup"}
          </button>
        </div>
        <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color:"var(--text-muted)" }}>
          <InfoIcon />Configure via <code className="font-mono px-1 py-0.5 rounded" style={{ background:"var(--bg-base)", color:"var(--text-secondary)" }}>RAW_TELEMETRY_RETENTION_DAYS</code> and <code className="font-mono px-1 py-0.5 rounded" style={{ background:"var(--bg-base)", color:"var(--text-secondary)" }}>TRIP_HISTORY_RETENTION_DAYS</code> in .env
        </p>
      </div>

      {/* API info */}
      <div className="card" style={{ background:"var(--bg-base)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:"var(--text-muted)" }}>Connected API</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:"var(--success)" }}/>
          <code className="font-mono text-sm" style={{ color:"var(--text-primary)" }}>{process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000"}</code>
        </div>
        <p className="text-xs mt-2" style={{ color:"var(--text-muted)" }}>Smart Transport FastAPI v1.0 · PostgreSQL + Redis</p>
      </div>
    </div>
  );
}
