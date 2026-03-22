"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import clsx from "clsx";

const I = {
  grid:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  bus:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>,
  route:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>,
  radio:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  users:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chL:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chR:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const NAV = [
  { group:"Main Menu", items:[
    { href:"/dashboard",   label:"Dashboard",        icon:I.grid },
    { href:"/analytics",   label:"Analytics",        icon:I.chart },
  ]},
  { group:"Fleet", items:[
    { href:"/vehicles",    label:"Vehicles",          icon:I.bus },
    { href:"/routes",      label:"Routes & Stops",    icon:I.route },
    { href:"/assignments", label:"Live Assignments",  icon:I.radio },
  ]},
  { group:"Management", items:[
    { href:"/users",       label:"Users & Drivers",   icon:I.users },
    { href:"/settings",    label:"Settings & ML",     icon:I.settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside className="sidebar-transition fixed left-0 top-0 h-screen z-40 flex flex-col"
      style={{ width: collapsed ? 64 : 240, background:"var(--bg-sidebar)", borderRight:"1px solid var(--border)" }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom:"1px solid var(--border)", minHeight:60 }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background:"var(--brand-subtle)", border:"1px solid var(--brand-border)", color:"var(--brand)" }}>
              {I.bus}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color:"var(--text-primary)", letterSpacing:"-0.02em" }}>BusTrack</div>
              <div className="text-[9px] uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>Admin</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto"
            style={{ background:"var(--brand-subtle)", border:"1px solid var(--brand-border)", color:"var(--brand)" }}>{I.bus}</div>
        )}
        {!collapsed && (
          <button onClick={toggle} className="p-1 rounded-md transition-colors" style={{ color:"var(--text-muted)" }}
            onMouseOver={e=>(e.currentTarget.style.background="var(--bg-hover)")}
            onMouseOut={e=>(e.currentTarget.style.background="transparent")}>{I.chL}</button>
        )}
      </div>

      {collapsed && (
        <button onClick={toggle} className="mx-auto mt-3 p-1.5 rounded-md" style={{ color:"var(--text-muted)" }}
          onMouseOver={e=>(e.currentTarget.style.background="var(--bg-hover)")}
          onMouseOut={e=>(e.currentTarget.style.background="transparent")}>{I.chR}</button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ overflowX:"hidden" }}>
        {NAV.map(section => (
          <div key={section.group} className="mb-5">
            {!collapsed && <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>{section.group}</p>}
            {collapsed && <div className="mb-2 border-t mx-2" style={{ borderColor:"var(--border)" }} />}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    className={clsx("nav-link", active && "active")}
                    style={collapsed ? { justifyContent:"center", padding:"8px 6px" } : {}}
                    title={collapsed ? label : undefined}>
                    <span className="flex-shrink-0">{icon}</span>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop:"1px solid var(--border)", padding:"8px" }}>
        {collapsed ? (
          <button onClick={logout} title="Sign out"
            className="w-full flex justify-center p-2 rounded-lg transition-colors"
            style={{ color:"var(--text-muted)" }}
            onMouseOver={e=>(e.currentTarget.style.color="var(--danger)")}
            onMouseOut={e=>(e.currentTarget.style.color="var(--text-muted)")}>
            {I.logout}
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background:"var(--brand-subtle)", color:"var(--brand)", border:"1px solid var(--brand-border)" }}>
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color:"var(--text-primary)" }}>{user?.username}</div>
              <div className="text-[10px] capitalize" style={{ color:"var(--text-muted)" }}>{user?.role}</div>
            </div>
            <button onClick={logout} title="Sign out" className="p-1 rounded flex-shrink-0" style={{ color:"var(--text-muted)" }}
              onMouseOver={e=>(e.currentTarget.style.color="var(--danger)")}
              onMouseOut={e=>(e.currentTarget.style.color="var(--text-muted)")}>
              {I.logout}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
