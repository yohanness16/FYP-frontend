"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(username, password); router.replace("/dashboard"); }
    catch (err: unknown) { setError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail || "Invalid credentials."); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-bg" style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── LEFT – branding panel ─────────────────────────────────────────── */}
      <div style={{
        flex: "0 0 52%", display: "none",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 72px", position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg,#060c1a 0%,#0d1830 100%)",
        borderRight: "1px solid var(--c-border)",
        /* show on lg+ */
      }} className="hidden lg:flex">

        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(var(--c-brand) 1px,transparent 1px),linear-gradient(90deg,var(--c-brand) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }} />
        {/* Glow blobs */}
        <div style={{ position:"absolute", top:"20%", left:"10%", width:380, height:380, borderRadius:"50%", background:"rgba(59,130,246,0.07)", filter:"blur(90px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"5%", width:280, height:280, borderRadius:"50%", background:"rgba(139,92,246,0.06)", filter:"blur(70px)", pointerEvents:"none" }} />

        <div style={{ position:"relative", maxWidth:400, textAlign:"center" }}>
          {/* Logo */}
          <div className="anim-pglow" style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:76, height:76, borderRadius:20, marginBottom:28,
            background:"linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.15))",
            border:"1px solid rgba(59,130,246,0.4)",
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
              <circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>
            </svg>
          </div>

          <h1 style={{ fontSize:32, fontWeight:800, color:"#e8f0fe", letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:14 }}>
            BusTrack<br/>Admin Console
          </h1>
          <p style={{ color:"#8ba3c4", lineHeight:1.7, marginBottom:36, fontSize:14 }}>
            Real-time fleet management, AI-powered ETA predictions, and live occupancy density monitoring.
          </p>

          {/* Feature list */}
          {[
            { icon:"📡", text:"Live GPS with outlier rejection" },
            { icon:"🤖", text:"ML vs heuristic ETA comparison" },
            { icon:"📊", text:"Occupancy density analytics" },
            { icon:"🔔", text:"Proximity notifications" },
          ].map(f => (
            <div key={f.text} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, textAlign:"left" }}>
              <span style={{ fontSize:18 }}>{f.icon}</span>
              <span style={{ color:"#8ba3c4", fontSize:13.5 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT – form panel ────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px" }}>

        {/* Mobile logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }} className="lg:hidden">
          <div style={{ width:38, height:38, borderRadius:10, background:"var(--c-brand-sub)", border:"1px solid var(--c-brand-bdr)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--c-brand)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>
          </div>
          <span style={{ fontSize:18, fontWeight:700, color:"var(--c-text)" }}>BusTrack</span>
        </div>

        <div className="anim-up" style={{ width:"100%", maxWidth:400 }}>
          {/* Heading */}
          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:22, fontWeight:700, color:"var(--c-text)", letterSpacing:"-0.02em", marginBottom:6 }}>
              Sign in to your account
            </h2>
            <p style={{ color:"var(--c-muted)", fontSize:13.5 }}>Enter your admin credentials to continue</p>
          </div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="admin" value={username} onChange={e=>setUsername(e.target.value)} required autoFocus />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position:"relative" }}>
                <input className="input" style={{ paddingRight:40 }}
                  type={showPw?"text":"password"} placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(s=>!s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--c-muted)", display:"flex" }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:8, background:"var(--c-red-sub)", border:"1px solid var(--c-red-bdr)", color:"var(--c-red)", fontSize:13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary"
              style={{ justifyContent:"center", padding:"11px", fontSize:14, marginTop:4 }}>
              {busy
                ? <><span style={{ width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> Signing in…</>
                : "Sign in to BusTrack"}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop:24, paddingTop:18, borderTop:"1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--c-muted)" }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--c-green)",display:"inline-block" }}/>
              API Connected
            </span>
            <code style={{ fontSize:11, color:"var(--c-muted)", fontFamily:"JetBrains Mono,monospace" }}>
              {(process.env.NEXT_PUBLIC_API_URL||"localhost:8000").replace(/^https?:\/\//, "")}
            </code>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.hidden{display:none}@media(min-width:1024px){.lg\\:flex{display:flex!important}.lg\\:hidden{display:none!important}}`}</style>
    </div>
  );
}
