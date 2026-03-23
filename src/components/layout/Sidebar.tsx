"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { useTheme } from "@/hooks/useTheme";
import { Bus, LayoutDashboard, BarChart3, Truck, Route, Radio, Users, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

const NAV = [
  { group:"MONITOR", items:[
    { href:"/dashboard",   label:"Dashboard",      icon:<LayoutDashboard size={18}/> },
    { href:"/analytics",   label:"Analytics",      icon:<BarChart3 size={18}/> },
  ]},
  { group:"FLEET", items:[
    { href:"/vehicles",    label:"Vehicles",        icon:<Truck size={18}/> },
    { href:"/routes",      label:"Routes & Stops",  icon:<Route size={18}/> },
    { href:"/assignments", label:"Live Trips",       icon:<Radio size={18}/> },
  ]},
  { group:"ADMIN", items:[
    { href:"/users",       label:"Users",            icon:<Users size={18}/> },
    { href:"/settings",    label:"Settings & ML",    icon:<Settings size={18}/> },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <aside className="sidebar-transition fixed left-0 top-0 h-screen z-40 flex flex-col"
      style={{ 
        width: collapsed ? "70px" : "240px", 
        // Gradient update: Light white base with a hint of cream-green for light mode
        background: isDark 
          ? "rgba(10, 10, 10, 0.4)" 
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 240, 0.7) 100%)", 
        backdropFilter: "blur(14px)",
        borderRight: isDark ? "1px solid rgba(255, 255, 255, 0.03)" : "1px solid rgba(0, 50, 20, 0.06)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>

      <div style={{ 
        padding: "24px 16px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: collapsed ? "center" : "space-between" 
      }}>
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--neon)" }}><Bus size={22} /></div>
            <span style={{ 
              fontFamily: "var(--font-display)", 
              fontWeight: 800, 
              fontSize: 18, 
              color: isDark ? "#fff" : "#1a2e24", 
              letterSpacing: "-0.03em" 
            }}>
              BusTrack
            </span>
          </div>
        ) : (
          <Bus size={22} color="var(--neon)" onClick={toggle} style={{ cursor: 'pointer' }}/>
        )}
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", overflow: "hidden" }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: 28 }}>
            {!collapsed && (
              <p style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: isDark ? "var(--text-4)" : "#6b7c72", 
                padding: "0 12px", 
                marginBottom: 12, 
                letterSpacing: "0.1em" 
              }}>
                {section.group}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {section.items.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    className={`nav-link ${active ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: active ? "var(--neon)" : (isDark ? "var(--text-3)" : "#4a5a51"),
                      background: active ? (isDark ? "rgba(0, 255, 153, 0.05)" : "rgba(0, 255, 153, 0.08)") : "transparent",
                      justifyContent: collapsed ? "center" : "flex-start",
                      transition: "all 0.2s ease"
                    }}
                    title={collapsed ? label : undefined}>
                    <span style={{ color: active ? "var(--neon)" : "inherit" }}>{icon}</span>
                    {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ 
        padding: "16px", 
        background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 50, 0, 0.02)", 
        borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 50, 0, 0.04)" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: "var(--neon-dim)", display: "flex", 
            alignItems: "center", justifyContent: "center", color: "var(--neon)", fontWeight: 700 
          }}>
            {user?.username?.[0]?.toUpperCase() || "Y"}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: isDark ? "#fff" : "#1a2e24", fontWeight: 600, margin: 0 }}>{user?.username}</p>
              <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 11, padding: 0, cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <button onClick={toggle} style={{
        position: "absolute", right: -12, top: 72, 
        width: 24, height: 24, borderRadius: "50%", 
        background: isDark ? "var(--bg-2)" : "#ffffff", 
        border: `1px solid ${isDark ? "var(--border)" : "#d1ddd5"}`, 
        color: isDark ? "var(--text)" : "#4a5a51", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        cursor: "pointer", zIndex: 50,
        boxShadow: isDark ? "none" : "0 3px 6px rgba(0, 40, 20, 0.08)"
      }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}