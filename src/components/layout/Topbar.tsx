"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useSidebar } from "@/hooks/useSidebar";
import { useState, useEffect } from "react";

const Sun  = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const Moon = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const Bell = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const Search=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const TITLES: Record<string,string> = {
  "/dashboard":   "Dashboard",
  "/analytics":   "Analytics",
  "/vehicles":    "Vehicles",
  "/routes":      "Routes & Stops",
  "/assignments": "Live Assignments",
  "/users":       "Users & Drivers",
  "/drivers":     "Drivers",
  "/settings":    "Settings & ML",
};

export function Topbar() {
  const pathname = usePathname();
  const title = TITLES[pathname] || "BusTrack";
  const { theme, toggle } = useTheme();
  const { collapsed } = useSidebar();
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5"
      style={{ height:60, background:"var(--bg-card)", borderBottom:"1px solid var(--border)", marginLeft: collapsed ? 64 : 240, transition:"margin-left 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color:"var(--text-primary)", letterSpacing:"-0.01em" }}>{title}</h1>
        <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>
          {time.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
          {" · "}<span style={{ fontFamily:"var(--font-mono)" }}>{time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Search box — NextAdmin style */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          style={{ background:"var(--bg-base)", border:"1px solid var(--border)", color:"var(--text-muted)", minWidth:180 }}>
          <Search/><span>Search…</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background:"var(--border)", color:"var(--text-muted)" }}>⌘K</kbd>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background:"var(--success-subtle)", color:"var(--success)", border:"1px solid var(--success-border)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:"var(--success)" }}/>Live
        </div>

        <button onClick={toggle} title={`Switch to ${theme==="dark"?"light":"dark"} mode`}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color:"var(--text-secondary)" }}
          onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background="var(--bg-hover)";(e.currentTarget as HTMLElement).style.color="var(--text-primary)"}}
          onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.color="var(--text-secondary)"}}>
          {theme==="dark"?<Sun/>:<Moon/>}
        </button>

        <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative"
          style={{ color:"var(--text-secondary)" }}
          onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}}
          onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background="transparent"}}>
          <Bell/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background:"var(--brand)" }}/>
        </button>
      </div>
    </header>
  );
}
