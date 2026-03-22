"use client";
import { useState, useCallback, useEffect } from "react";
import { usersApi } from "@/lib/api";
import { DataTable, ColDef } from "@/components/ui/DataTable";
import { PageLoader } from "@/components/ui/Spinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Icons
const Plus    = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const Shield  = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const Truck   = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const Eye     = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff  = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const Warn    = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const UsersIc = ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

interface CreatedUser { id:number; username:string; email:string; role:string; created_at:string; }

// ─── Seed some demo data so charts look good ─────────────────────────────────
function buildChartData(users: CreatedUser[]) {
  // Group by date created
  const map: Record<string, { total:number; drivers:number; admins:number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    map[key] = { total:0, drivers:0, admins:0 };
  }
  users.forEach(u => {
    const key = u.created_at.slice(0,10);
    if (map[key]) {
      map[key].total++;
      if (u.role === "driver") map[key].drivers++;
      if (u.role === "admin")  map[key].admins++;
    }
  });
  let running = 0;
  return Object.entries(map).map(([date, v]) => {
    running += v.total;
    return { date: date.slice(5), total: running, new: v.total, drivers: v.drivers, admins: v.admins };
  });
}

const ChartTT = ({ active, payload, label }: {active?:boolean;payload?:{name:string;value:number;color:string}[];label?:string}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      <p style={{ color:"var(--text-muted)", marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddModal({ onClose, onSaved }: { onClose:()=>void; onSaved:(u:CreatedUser)=>void }) {
  const [form, setForm] = useState({ username:"", email:"", password:"", role:"driver" as "driver"|"admin" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try { const r=await usersApi.createAdmin(form); onSaved(r.data); onClose(); }
    catch(err:unknown){ setError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail??"Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <span className="section-title">Create Driver / Admin</span>
          <button onClick={onClose} style={{ fontSize:20, lineHeight:1, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>×</button>
        </div>

        {/* Role toggle */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:4, background:"var(--bg-base)", borderRadius:10, marginBottom:16, border:"1px solid var(--border)" }}>
          {(["driver","admin"] as const).map(r => (
            <button key={r} type="button" onClick={()=>setForm(f=>({...f,role:r}))}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px", borderRadius:7, fontSize:13.5, fontWeight:500, cursor:"pointer", border:"none", transition:"all 0.15s",
                background:form.role===r?"var(--brand)":"transparent", color:form.role===r?"#fff":"var(--text-secondary)" }}>
              {r==="driver"?<Truck/>:<Shield/>}
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div><label className="label">Username *</label><input className="input" placeholder="e.g. driver_tadesse" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required minLength={3}/></div>
          <div><label className="label">Email *</label><input className="input" type="email" placeholder="user@bustrack.et" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required /></div>
          <div>
            <label className="label">Password *</label>
            <div style={{ position:"relative" }}>
              <input className="input" style={{ paddingRight:38 }} type={showPw?"text":"password"} placeholder="Min. 8 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={8}/>
              <button type="button" onClick={()=>setShowPw(s=>!s)}
                style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>
                {showPw?<EyeOff/>:<Eye/>}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 12px", borderRadius:8, background:"var(--danger-subtle)", border:"1px solid var(--danger-border)", color:"var(--danger)", fontSize:13 }}>
              <Warn/>{error}
            </div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1, justifyContent:"center" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, justifyContent:"center" }}>
              {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:"Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]     = useState<CreatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filterRole, setFilterRole] = useState<"all"|"driver"|"admin">("all");

  // In production this would fetch from a users list API endpoint
  // For now we manage local state; newly created users persist per session
  const filtered = users.filter(u => filterRole === "all" || u.role === filterRole);
  const chartData = buildChartData(users);

  const roleStyle: Record<string,{bg:string;color:string;border:string}> = {
    driver: { bg:"var(--warning-subtle)", color:"var(--warning)", border:"var(--warning-border)" },
    admin:  { bg:"var(--brand-subtle)",   color:"var(--brand)",   border:"var(--brand-border)"   },
  };

  const columns: ColDef<CreatedUser & Record<string,unknown>>[] = [
    { key:"username", label:"User", render: u => (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--brand-subtle)", border:"1px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--brand)", flexShrink:0 }}>
          {u.username[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:500, color:"var(--text-primary)" }}>{u.username}</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>{u.email}</div>
        </div>
      </div>
    )},
    { key:"role", label:"Role", align:"center", render: u => {
      const s = roleStyle[u.role] ?? { bg:"var(--bg-hover)", color:"var(--text-secondary)", border:"var(--border)" };
      return (
        <span className="badge" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
          {u.role === "driver" ? <Truck /> : u.role === "admin" ? <Shield /> : null}
          {u.role.charAt(0).toUpperCase()+u.role.slice(1)}
        </span>
      );
    }},
    { key:"created_at", label:"Created", render: u => (
      <span style={{ fontSize:12.5, color:"var(--text-muted)" }}>
        {new Date(u.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
      </span>
    )},
    { key:"id", label:"ID", align:"right", render: u => (
      <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-muted)" }}>#{u.id}</span>
    )},
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onSaved={u=>setUsers(p=>[u,...p])} />}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 className="section-title" style={{ fontSize:20 }}>Users</h2>
          <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
            {users.length} total · {users.filter(u=>u.role==="driver").length} drivers · {users.filter(u=>u.role==="admin").length} admins
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="btn-primary"><Plus />Create Driver / Admin</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Total Users",  val:users.length,                                color:"var(--brand)",   icon:<UsersIc/> },
          { label:"Drivers",      val:users.filter(u=>u.role==="driver").length,    color:"var(--warning)", icon:<Truck/>   },
          { label:"Admins",       val:users.filter(u=>u.role==="admin").length,     color:"var(--purple)",  icon:<Shield/>  },
          { label:"Added Today",  val:users.filter(u=>u.created_at.slice(0,10)===new Date().toISOString().slice(0,10)).length, color:"var(--success)", icon:<Plus/> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:500 }}>{s.label}</span>
              <span style={{ color:s.color }}>{s.icon}</span>
            </div>
            <p style={{ fontSize:26, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {users.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {/* Cumulative users */}
          <div className="card">
            <p className="section-title" style={{ marginBottom:14, fontSize:14 }}>Cumulative Users</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="date" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTT/>}/>
                <Line type="monotone" dataKey="total" name="Total Users" stroke="var(--brand)" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* New users per day */}
          <div className="card">
            <p className="section-title" style={{ marginBottom:14, fontSize:14 }}>New Users per Day</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="date" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTT/>}/>
                <Line type="monotone" dataKey="drivers" name="Drivers" stroke="var(--warning)" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="admins"  name="Admins"  stroke="var(--purple)"  strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div style={{ display:"flex", gap:10, padding:"12px 16px", borderRadius:10, background:"var(--brand-subtle)", border:"1px solid var(--brand-border)" }}>
        <Shield />
        <div>
          <p style={{ fontSize:13, fontWeight:500, color:"var(--brand)" }}>Admin-created accounts only</p>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>Passengers register via the mobile app. Use this page to create driver and admin accounts.</p>
        </div>
      </div>

      {/* Role filter + table */}
      <div>
        <div style={{ display:"flex", gap:6, padding:4, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, width:"fit-content", marginBottom:14 }}>
          {(["all","driver","admin"] as const).map(f=>(
            <button key={f} onClick={()=>setFilterRole(f)}
              style={{ padding:"6px 14px", borderRadius:7, fontSize:13, fontWeight:500, cursor:"pointer", border:"none", transition:"all 0.15s", textTransform:"capitalize",
                background:filterRole===f?"var(--brand)":"transparent", color:filterRole===f?"#fff":"var(--text-secondary)" }}>
              {f}{f!=="all"&&` (${users.filter(u=>u.role===f).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem", background:"var(--bg-card)", border:"2px dashed var(--border)", borderRadius:12 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"var(--brand-subtle)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"var(--brand)" }}>
              <UsersIc />
            </div>
            <p style={{ fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>No {filterRole === "all" ? "users" : filterRole + "s"} yet</p>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:18 }}>Create driver and admin accounts to manage your fleet.</p>
            <button onClick={()=>setShowAdd(true)} className="btn-primary" style={{ margin:"0 auto" }}><Plus/>Create User</button>
          </div>
        ) : (
          <DataTable
            columns={columns as ColDef<Record<string,unknown>>[]}
            data={filtered as unknown as Record<string,unknown>[]}
            searchPlaceholder="Search by name or email…"
            searchKeys={["username","email","role"]}
            emptyMessage="No users match your search"
            pageSize={10}
          />
        )}
      </div>
    </div>
  );
}
