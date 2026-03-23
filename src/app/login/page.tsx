"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Zap, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(username, password); router.replace("/dashboard"); }
    catch (err: unknown) { setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Invalid credentials"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", fontFamily: "var(--font-body)", position: "relative" }}>
      
      {/* Left — Professional Motion UI Panel */}
      <div style={{ flex: "0 0 50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", position: "relative", overflow: "hidden", borderRight: "1px solid var(--border)" }} className="hidden lg:flex">
        
        {/* Animated Grid Background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,180,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,180,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", animation: "gridMove 20s linear infinite" }} />
        
        {/* Dynamic Radial Glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,180,0.08) 0%, transparent 70%)", pointerEvents: "none", animation: "pulseGlow 4s infinite alternate" }} />

        <div style={{ position: "relative", maxWidth: 440, textAlign: "left" }}>
          {/* Header Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, animation: "fadeInUp 0.6s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, var(--neon-dim) 0%, rgba(0,255,180,0.05) 100%)", border: "1px solid var(--neon-border)", boxShadow: "0 8px 32px rgba(0,255,180,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)", animation: "shimmer 3s infinite" }} />
              <Zap size={32} color="var(--neon)" style={{ animation: "pulse 2s infinite" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 6, fontFamily: "var(--font-display)" }}>
                BusTrack
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neon)", animation: "flash 1.5s infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--neon)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Console</span>
              </div>
            </div>
          </div>

          <p style={{ color: "var(--text-3)", fontSize: 15, lineHeight: 1.7, marginBottom: 40, animation: "fadeInUp 0.6s ease-out 0.2s", animationFillMode: "backwards" }}>
            Real-time fleet intelligence. Leverage AI-powered ETA predictions and live occupancy monitoring for optimized city transit.
          </p>

          {/* Animated Feature Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeInUp 0.6s ease-out 0.4s", animationFillMode: "backwards" }}>
            {[
              { icon: "icon-gps", title: "Precision", text: "GPS outlier rejection" },
              { icon: "icon-brain", title: "Intelligence", text: "ML vs Heuristic ETAs" },
              { icon: "icon-chart", title: "Analytics", text: "Density monitoring" },
              { icon: "icon-bolt", title: "Real-time", text: "WebSocket updates" },
            ].map((f) => (
              <div key={f.title} className="feature-card" style={{ padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={f.icon} style={{ width: 24, height: 24, color: "var(--neon)" }} />
                <div>
                  <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11 }}>{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        
        {/* Mobile logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }} className="lg:hidden">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={17} color="var(--neon)" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>BusTrack</span>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "var(--font-display)" }}>Sign in</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "flash 1.5s infinite" }} />
              <span style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Secure Access</span>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required autoFocus style={{ fontSize: 14 }} />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: "relative" }}>
                <input className="input" style={{ paddingRight: 42, fontSize: 14 }} type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
                <AlertCircle size={14} />{error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary" style={{ justifyContent: "center", padding: "11px", fontSize: 14, marginTop: 4, borderRadius: 10, fontFamily: "var(--font-display)" }}>
              {busy ? (
                <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Signing in…</>
              ) : "Sign in "}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
               Connected
            </span>
            <code style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              {(process.env.NEXT_PUBLIC_API_URL || "localhost:8000").replace(/^https?:\/\//, "")}
            </code>
          </div>
        </div>
      </div>

      {/* Full Width Absolute Footer */}
      <footer style={{ 
        position: "absolute", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: "16px 24px", 
        textAlign: "center", 
        borderTop: "1px solid var(--border)",
        background: "rgba(var(--bg-rgb), 0.5)", // Assumes you have a background RGB variable
        backdropFilter: "blur(4px)",
        zIndex: 10
      }}>
         <p style={{ fontSize: 11, color: "var(--text-3)", opacity: 0.6, letterSpacing: "0.03em" }}>
           &copy; {new Date().getFullYear()} BusTrack Admin Console • All Rights Reserved
         </p>
      </footer>

      {/* Hydration-safe CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hidden{display:none}
        @media(min-width:1024px){.lg\\:flex{display:flex!important}.lg\\:hidden{display:none!important}}
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes gridMove { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        @keyframes pulseGlow { 0% { opacity: 0.5; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 1; transform: translate(-50%,-50%) scale(1.1); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .feature-card:hover { background: rgba(0,255,180,0.05) !important; border-color: var(--neon-border) !important; transform: translateY(-2px); transition: all 0.3s ease; }

        .icon-gps { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ffb4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
        .icon-brain { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ffb4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
        .icon-chart { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ffb4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 20V10M12 20V4M6 20v-6'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
        .icon-bolt { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ffb4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
      ` }} />
    </div>
  );
}