"use client";
import { useState, useEffect } from "react";
import { usersApi } from "@/lib/api";
import { DataTable, ColDef } from "@/components/ui/DataTable";
import { Shield, Truck, Eye, EyeOff, AlertCircle, Plus, Users, Info, Trash2 } from "lucide-react";

interface CreatedUser { id: number; username: string; email: string; role: string; created_at: string; }

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: (u: CreatedUser) => void }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "driver" as "driver" | "admin" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try { const r = await usersApi.createAdmin(form); onSaved(r.data); onClose(); }
    catch (err: unknown) { setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
      <div className="anim-up" style={{ background: "var(--bg-2)", border: "1px solid var(--neon-border)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-neon)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={15} color="var(--neon)" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>Create Driver / Admin</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, background: "var(--bg-1)", borderRadius: 10, marginBottom: 16, border: "1px solid var(--border)" }}>
          {(["driver", "admin"] as const).map(r => (
            <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", transition: "all 0.15s", background: form.role === r ? "var(--neon)" : "transparent", color: form.role === r ? "#000" : "var(--text-2)" }}>
              {r === "driver" ? <Truck size={13} /> : <Shield size={13} />}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="label">Username *</label><input className="input" placeholder="e.g. driver_abebe" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required minLength={3} /></div>
          <div><label className="label">Email *</label><input className="input" type="email" placeholder="user@bustrack.et" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
          <div>
            <label className="label">Password *</label>
            <div style={{ position: "relative" }}>
              <input className="input" style={{ paddingRight: 40 }} type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}><AlertCircle size={13} />{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {saving ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const roleStyle: Record<string, { bg: string; color: string; border: string }> = {
  driver: { bg: "var(--amber-dim)", color: "var(--amber)", border: "var(--amber-border)" },
  admin: { bg: "var(--neon-dim)", color: "var(--neon)", border: "var(--neon-border)" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<CreatedUser[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterRole, setFilterRole] = useState<"all" | "driver" | "admin">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [adminsRes, driversRes] = await Promise.all([
          usersApi.listadmins(),
          usersApi.listdrivers()
        ]);
        const admins = adminsRes.data.map((u: CreatedUser) => ({ ...u, role: "admin" }));
        const drivers = driversRes.data.map((u: CreatedUser) => ({ ...u, role: "driver" }));
        setUsers([...admins, ...drivers]);
      } catch {}
    };
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    setDeletingId(id);
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {}
    finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u => filterRole === "all" || u.role === filterRole);

  const columns: ColDef<CreatedUser & Record<string, unknown>>[] = [
    {
      key: "username", label: "User",
      render: u => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--neon)", flexShrink: 0, fontFamily: "var(--font-display)" }}>
            {(u as unknown as CreatedUser).username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{(u as unknown as CreatedUser).username}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{(u as unknown as CreatedUser).email}</div>
          </div>
        </div>
      )
    },
    {
      key: "role", label: "Role", align: "center",
      render: u => {
        const uu = u as unknown as CreatedUser;
        const s = roleStyle[uu.role] ?? { bg: "var(--bg-3)", color: "var(--text-2)", border: "var(--border)" };
        return (
          <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {uu.role === "driver" ? <Truck size={10} /> : uu.role === "admin" ? <Shield size={10} /> : null}
            {uu.role.charAt(0).toUpperCase() + uu.role.slice(1)}
          </span>
        );
      }
    },
    {
      key: "created_at", label: "Created",
      render: u => <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{new Date((u as unknown as CreatedUser).created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
    },
    {
      key: "id", label: "ID", align: "right",
      render: u => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-4)" }}>#{(u as unknown as CreatedUser).id}</span>
    },
    {
      key: "actions", label: "",
      render: u => {
        const uu = u as unknown as CreatedUser;
        return (
          <button
            onClick={() => handleDelete(uu.id)}
            disabled={deletingId === uu.id}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {deletingId === uu.id ? (
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,0,0,0.2)", borderTopColor: "var(--red)", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        );
      }
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={u => setUsers(p => [u, ...p])} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Users</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{users.length} total · {users.filter(u => u.role === "driver").length} drivers · {users.filter(u => u.role === "admin").length} admins</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} />Create Driver / Admin</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Users", val: users.length, color: "var(--text)", icon: <Users size={15} /> },
          { label: "Drivers", val: users.filter(u => u.role === "driver").length, color: "var(--amber)", icon: <Truck size={15} /> },
          { label: "Admins", val: users.filter(u => u.role === "admin").length, color: "var(--neon)", icon: <Shield size={15} /> },
          { label: "Added Today", val: users.filter(u => u.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, color: "var(--green)", icon: <Plus size={15} /> },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "var(--font-display)", lineHeight: 1 }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)" }}>
        <Info size={14} color="var(--neon)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--neon)" }}>Admin-created accounts only</p>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Passengers register via the mobile app. Use this page to create driver and admin accounts.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {(["all", "driver", "admin"] as const).map(f => (
          <button key={f} onClick={() => setFilterRole(f)}
            style={{ padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: filterRole === f ? "var(--neon)" : "transparent", color: filterRole === f ? "#000" : "var(--text-2)" }}>
            {f}{f !== "all" && ` (${users.filter(u => u.role === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-2)", border: "2px dashed var(--border)", borderRadius: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--neon-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid var(--neon-border)" }}>
            <Users size={22} color="var(--neon)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No {filterRole === "all" ? "users" : filterRole + "s"} yet</p>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 18 }}>Create driver and admin accounts to manage your fleet.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ margin: "0 auto" }}><Plus size={14} />Create User</button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as (CreatedUser & Record<string, unknown>)[]}
          searchPlaceholder="Search by name or email…"
          searchKeys={["username", "email", "role"]}
          emptyMessage="No users match your search"
          pageSize={10}
        />
      )}
    </div>
  );
}