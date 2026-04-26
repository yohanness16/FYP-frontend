"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import { DataTable, ColDef, TableAction } from "@/components/ui/DataTable";
import { PageLoader } from "@/components/ui/Spinner";
import {
  AlertCircle,
  Eye,
  EyeOff,
  PencilLine,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Truck,
  UserCircle2,
  Users,
} from "lucide-react";

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: JSX.Element }> = {
  passenger: {
    label: "Passenger",
    color: "var(--text-2)",
    bg: "var(--bg-3)",
    border: "var(--border)",
    icon: <Users size={10} />,
  },
  driver: {
    label: "Driver",
    color: "var(--amber)",
    bg: "var(--amber-dim)",
    border: "var(--amber-border)",
    icon: <Truck size={10} />,
  },
  admin: {
    label: "Admin",
    color: "var(--neon)",
    bg: "var(--neon-dim)",
    border: "var(--neon-border)",
    icon: <Shield size={10} />,
  },
};

type UserForm = {
  username: string;
  email: string;
  password: string;
  role: "driver" | "admin";
};

function UserModal({
  mode,
  initialValue,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initialValue?: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const [form, setForm] = useState<UserForm>({
    username: initialValue?.username ?? "",
    email: initialValue?.email ?? "",
    password: "",
    role: (initialValue?.role === "admin" ? "admin" : "driver") as "driver" | "admin",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm({
      username: initialValue?.username ?? "",
      email: initialValue?.email ?? "",
      password: "",
      role: (initialValue?.role === "admin" ? "admin" : "driver") as "driver" | "admin",
    });
  }, [initialValue]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };

      const response =
        mode === "create"
          ? await usersApi.createAdmin({
              username: payload.username,
              email: payload.email,
              password: form.password.trim(),
              role: payload.role,
            })
          : await usersApi.update(initialValue!.id, payload);

      onSaved(response.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Failed to save user"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div
        className="anim-up"
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 18,
          padding: 20,
          background: "var(--bg-2)",
          border: "1px solid var(--neon-border)",
          boxShadow: "var(--shadow-neon)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="var(--neon)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                {mode === "create" ? "Create Driver / Admin" : `Edit ${initialValue?.username ?? "User"}`}
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                {mode === "create" ? "Provision a backend-managed account." : "Update account details via /admin/users/update."}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="label">Username *</label>
            <input
              className="input"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              required
              minLength={3}
              placeholder="driver_abebe"
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="user@bustrack.et"
            />
          </div>
          <div>
            <label className="label">Password {mode === "edit" ? "(optional)" : "*"}</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ paddingRight: 42 }}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required={mode === "create"}
                minLength={mode === "create" ? 8 : undefined}
                placeholder={mode === "create" ? "Min. 8 characters" : "Leave blank to keep current password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              {(["driver", "admin"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, role }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: form.role === role ? "var(--neon)" : "transparent",
                    color: form.role === role ? "#03110d" : "var(--text-2)",
                    fontWeight: 600,
                  }}
                >
                  {role === "driver" ? <Truck size={13} /> : <Shield size={13} />}
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {saving ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : mode === "create" ? "Create User" : "Save Changes"}
            </button>
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
      const driverUsers = (Array.isArray(driversRes.data) ? driversRes.data : []).map((entry: User) => ({ ...entry, role: "driver" as const }));
      const adminUsers = (Array.isArray(adminsRes.data) ? adminsRes.data : []).map((entry: User) => ({ ...entry, role: "admin" as const }));
      setUsers([...adminUsers, ...driverUsers]);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => filterRole === "all" || entry.role === filterRole);
  }, [users, filterRole]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this account?")) return;
    setDeletingId(id);
    try {
      await usersApi.delete(id);
      setUsers((current) => current.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const actions: TableAction<User>[] = [
    {
      label: "Edit",
      icon: <PencilLine size={13} />,
      onClick: (row) => {
        setEditingUser(row);
        setShowModal(true);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 size={13} />,
      danger: true,
      onClick: (row) => void handleDelete(row.id),
    },
  ];

  const columns: ColDef<User>[] = [
    {
      key: "username",
      label: "User",
      render: (entry) => {
        const meta = ROLE_META[entry.role] ?? ROLE_META.passenger;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: meta.bg, border: `1px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0, fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {entry.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{entry.username}</span>
                <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{entry.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      align: "center",
      render: (entry) => {
        const meta = ROLE_META[entry.role] ?? ROLE_META.passenger;
        return <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.icon}{meta.label}</span>;
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (entry) => (
        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
          {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "id",
      label: "ID",
      align: "right",
      render: (entry) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-4)" }}>#{entry.id}</span>,
    },
  ];

  const roleCounts = {
    passenger: users.filter((entry) => entry.role === "passenger").length,
    driver: users.filter((entry) => entry.role === "driver").length,
    admin: users.filter((entry) => entry.role === "admin").length,
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showModal && (
        <UserModal
          mode={editingUser ? "edit" : "create"}
          initialValue={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingUser(null);
            setRefreshing(true);
            void load();
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Users</h2>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Backend-managed fleet accounts and admin identities</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setRefreshing(true); void load(); }} className="btn-secondary" disabled={refreshing}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
          <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="btn-primary">
            <Plus size={14} />Create Driver / Admin
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Users", val: users.length, color: "var(--text)", icon: <Users size={15} /> },
          { label: "Drivers", val: roleCounts.driver, color: "var(--amber)", icon: <Truck size={15} /> },
          { label: "Admins", val: roleCounts.admin, color: "var(--neon)", icon: <Shield size={15} /> },
          { label: "Passengers", val: roleCounts.passenger, color: "var(--cyan)", icon: <UserCircle2 size={15} /> },
        ].map((entry) => (
          <div key={entry.label} className="card-sm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{entry.label}</span>
              <span style={{ color: entry.color }}>{entry.icon}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: entry.color, fontFamily: "var(--font-display)", lineHeight: 1 }}>{entry.val}</p>
          </div>
        ))}
      </div>

      {user && (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--neon-dim)", border: "1px solid var(--neon-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--neon)", fontWeight: 800, fontFamily: "var(--font-display)" }}>
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Signed in as {user.username}</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{user.email} · {ROLE_META[user.role]?.label ?? user.role}</p>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>Manage driver and admin accounts through the backend.</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content", flexWrap: "wrap" }}>
        {(["all", "driver", "admin", "passenger"] as const).map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            style={{ padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", background: filterRole === role ? "var(--neon)" : "transparent", color: filterRole === role ? "#000" : "var(--text-2)" }}
          >
            {role}{role !== "all" && ` (${roleCounts[role]})`}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-2)", border: "2px dashed var(--border)", borderRadius: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--neon-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid var(--neon-border)" }}>
            <Users size={22} color="var(--neon)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No {filterRole === "all" ? "users" : filterRole + "s"} yet</p>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 18 }}>Create driver and admin accounts to manage your fleet.</p>
          <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="btn-primary" style={{ margin: "0 auto" }}>
            <Plus size={14} />Create User
          </button>
        </div>
      ) : (
        <DataTable<User>
          data={filteredUsers}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search by username, email, or role…"
          searchKeys={["username", "email", "role"]}
          emptyMessage="No users match your search"
          pageSize={10}
        />
      )}
    </div>
  );
}
