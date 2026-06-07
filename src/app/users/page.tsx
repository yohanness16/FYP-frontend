"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import { DataTable, ColDef, TableAction } from "@/components/ui/DataTable";
import { PageLoader } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle, Eye, EyeOff, PencilLine, Plus, RefreshCw, Shield, Trash2, Truck, Users, UserCircle2,
} from "lucide-react";

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: JSX.Element }> = {
  passenger: { label: "Passenger", color: "var(--text-2)", bg: "var(--bg-3)", border: "var(--border)", icon: <Users size={10} /> },
  driver: { label: "Driver", color: "var(--warning)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", icon: <Truck size={10} /> },
  admin: { label: "Admin", color: "var(--neon)", bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.25)", icon: <Shield size={10} /> },
};

type UserForm = { username: string; email: string; password: string; role: "driver" | "admin" };

function UserModal({ mode, initialValue, onClose, onSaved }: { mode: "create" | "edit"; initialValue?: User | null; onClose: () => void; onSaved: (user: User) => void }) {
  const [form, setForm] = useState<UserForm>({ username: initialValue?.username ?? "", email: initialValue?.email ?? "", password: "", role: (initialValue?.role === "admin" ? "admin" : "driver") as "driver" | "admin" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { setForm({ username: initialValue?.username ?? "", email: initialValue?.email ?? "", password: "", role: (initialValue?.role === "admin" ? "admin" : "driver") as "driver" | "admin" }); }, [initialValue]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { username: form.username.trim(), email: form.email.trim(), role: form.role, ...(form.password.trim() ? { password: form.password.trim() } : {}) };
      const response = mode === "create"
        ? await usersApi.createAdmin({ username: payload.username, email: payload.email, password: form.password.trim(), role: payload.role })
        : await usersApi.update(initialValue!.id, payload);
      onSaved(response.data); onClose();
    } catch (err: unknown) { setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save user"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="anim-up modal-box" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"><Users size={16} className="text-primary" /></div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">{mode === "create" ? "Create Driver / Admin" : `Edit ${initialValue?.username ?? "User"}`}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{mode === "create" ? "Provision a backend-managed account." : "Update account details via /admin/users/update."}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div><label className="label">Username *</label><input className="input" value={form.username} onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))} required minLength={3} placeholder="driver_abebe" /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} required placeholder="user@bustrack.et" /></div>
          <div>
            <label className="label">Password {mode === "edit" ? "(optional)" : "*"}</label>
            <div className="relative">
              <input className="input pr-10" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} required={mode === "create"} minLength={mode === "create" ? 8 : undefined} placeholder={mode === "create" ? "Min. 8 characters" : "Leave blank to keep current password"} />
              <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-lg bg-muted border border-border">
              {(["driver", "admin"] as const).map((role) => (
                <button key={role} type="button" onClick={() => setForm((c) => ({ ...c, role }))} className={`flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold transition-all ${form.role === role ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>
                  {role === "driver" ? <Truck size={13} /> : <Shield size={13} />}{role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"><AlertCircle size={14} />{error}</div>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" /> : mode === "create" ? "Create User" : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<"all" | "passenger" | "driver" | "admin">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [driversRes, adminsRes] = await Promise.all([usersApi.listDrivers(), usersApi.listAdmins()]);
      const driverUsers = (Array.isArray(driversRes.data) ? driversRes.data : []).map((d: User) => ({ ...d, role: "driver" as const }));
      const adminUsers = (Array.isArray(adminsRes.data) ? adminsRes.data : []).map((a: User) => ({ ...a, role: "admin" as const }));
      setUsers([...adminUsers, ...driverUsers]);
    } catch (error) { console.error("Failed to load users:", error); setUsers([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredUsers = useMemo(() => users.filter((u) => filterRole === "all" || u.role === filterRole), [users, filterRole]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this account?")) return;
    setDeletingId(id);
    try { await usersApi.delete(id); setUsers((c) => c.filter((u) => u.id !== id)); }
    catch (error) { console.error("Failed to delete user:", error); }
    finally { setDeletingId(null); }
  };

  const actions: TableAction<User>[] = [
    { label: "Edit", icon: <PencilLine size={13} />, onClick: (row) => { setEditingUser(row); setShowModal(true); } },
    { label: "Delete", icon: <Trash2 size={13} />, danger: true, onClick: (row) => void handleDelete(row.id) },
  ];

  const columns: ColDef<User>[] = [
    {
      key: "username", label: "User",
      render: (u) => {
        const meta = ROLE_META[u.role] ?? ROLE_META.passenger;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm font-display" style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>{u.username.slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{u.username}</span>
                <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.icon}{meta.label}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    { key: "role", label: "Role", align: "center", render: (u) => { const meta = ROLE_META[u.role] ?? ROLE_META.passenger; return <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.icon}{meta.label}</span>; } },
    { key: "created_at", label: "Created", render: (u) => <span className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> },
    { key: "id", label: "ID", align: "right", render: (u) => <span className="font-mono text-xs text-muted-foreground">#{u.id}</span> },
  ];

  const roleCounts = { passenger: users.filter((u) => u.role === "passenger").length, driver: users.filter((u) => u.role === "driver").length, admin: users.filter((u) => u.role === "admin").length };

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      {showModal && <UserModal mode={editingUser ? "edit" : "create"} initialValue={editingUser} onClose={() => { setShowModal(false); setEditingUser(null); }} onSaved={() => { setShowModal(false); setEditingUser(null); setRefreshing(true); void load(); }} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Users</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Backend-managed fleet accounts and admin identities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRefreshing(true); void load(); }} className="btn-secondary" disabled={refreshing}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
          <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="btn-primary"><Plus size={14} />Create Driver / Admin</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", val: users.length, color: "text-foreground", icon: <Users size={15} /> },
          { label: "Drivers", val: roleCounts.driver, color: "text-amber-500", icon: <Truck size={15} /> },
          { label: "Admins", val: roleCounts.admin, color: "text-primary", icon: <Shield size={15} /> },
          { label: "Passengers", val: roleCounts.passenger, color: "text-sky-500", icon: <UserCircle2 size={15} /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</span>
                <span className={s.color}>{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {user && (
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold font-display">{user.username.slice(0, 1).toUpperCase()}</div>
              <div>
                <p className="text-sm font-bold text-foreground">Signed in as {user.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email} · {ROLE_META[user.role]?.label ?? user.role}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Manage driver and admin accounts through the backend.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 p-1 bg-muted border border-border rounded-lg w-fit flex-wrap">
        {(["all", "driver", "admin", "passenger"] as const).map((role) => (
          <button key={role} onClick={() => setFilterRole(role)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filterRole === role ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>{role}{role !== "all" && ` (${roleCounts[role]})`}</button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20"><Users size={22} className="text-primary" /></div>
          <p className="font-semibold text-foreground mb-1">No {filterRole === "all" ? "users" : filterRole + "s"} yet</p>
          <p className="text-sm text-muted-foreground mb-5">Create driver and admin accounts to manage your fleet.</p>
          <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="btn-primary mx-auto"><Plus size={14} />Create User</button>
        </div>
      ) : (
        <DataTable<User> data={filteredUsers} columns={columns} actions={actions} searchPlaceholder="Search by username, email, or role…" searchKeys={["username", "email", "role"]} emptyMessage="No users match your search" pageSize={10} />
      )}
    </div>
  );
}
