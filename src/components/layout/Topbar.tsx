"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect } from "react";
import { Sun, Moon, Bell } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "System Overview",
  "/analytics": "Fleet Intelligence",
  "/vehicles": "Vehicle Registry",
  "/routes": "Network Mapping",
  "/assignments": "Active Operations",
  "/users": "Access Control",
  "/settings": "Core Configuration",
};

export function Topbar() {
  const pathname = usePathname();
  const title = TITLES[pathname] || "BusTrack Ops";
  const { theme, toggle } = useTheme();
  const [time, setTime] = useState(new Date());

  const isDark = theme === "dark";

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      background: isDark 
        ? "rgba(10, 10, 10, 0.2)" 
        : "linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(240, 248, 240, 0.7))",
      backdropFilter: "blur(12px)",
      borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.03)" : "1px solid rgba(0, 80, 40, 0.08)",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1 style={{ 
          fontSize: 18, 
          fontWeight: 800, 
          color: isDark ? "#fff" : "#142b20", // Deep forest green for contrast
          letterSpacing: "-0.03em",
          margin: 0,
          fontFamily: "'Syne', sans-serif"
        }}>
          {title}
        </h1>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 10, 
          fontWeight: 600,
          color: isDark ? "var(--text-4)" : "#7a8a81", // Muted sage green
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.02em"
        }}>
          <span>{time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ color: isDark ? "var(--text-2)" : "#4a5a51" }}>
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Adjusted Live Status */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 10,
          background: isDark ? "rgba(0, 255, 153, 0.05)" : "rgba(0, 200, 120, 0.08)",
          border: isDark ? "1px solid rgba(0, 255, 153, 0.1)" : "1px solid rgba(0, 180, 100, 0.15)",
        }}>
          <span style={{ 
            width: 7, 
            height: 7, 
            borderRadius: "50%", 
            background: "#00ff99", 
            boxShadow: isDark ? "0 0 10px #00ff99" : "0 0 8px rgba(0, 180, 100, 0.6)",
            animation: "pulseGlow 2s infinite ease-in-out" 
          }} />
          <span style={{ 
            color: isDark ? "var(--neon)" : "#008a54", // Sharper green for light mode
            fontSize: 10, 
            fontWeight: 800, 
            letterSpacing: "0.08em" 
          }}>
            NETWORK LIVE
          </span>
        </div>

        <div style={{ 
          width: 1, 
          height: 24, 
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,80,40,0.1)", 
          margin: "0 2px" 
        }} />

        {/* Buttons with improved light-mode states */}
        <button onClick={toggle} style={{
          background: "transparent",
          border: "none",
          borderRadius: 10,
          padding: 8,
          cursor: "pointer",
          color: isDark ? "var(--text-2)" : "#4a5a51",
          display: "flex",
          alignItems: "center",
          transition: "background 0.2s",
        }} className="hover-subtle">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button style={{
          background: "transparent",
          border: "none",
          borderRadius: 10,
          padding: 8,
          cursor: "pointer",
          color: isDark ? "var(--text-2)" : "#4a5a51",
          position: "relative",
          display: "flex",
          alignItems: "center"
        }} className="hover-subtle">
          <Bell size={18} />
          <span style={{ 
            position: "absolute", 
            top: 6, 
            right: 6, 
            width: 7, 
            height: 7, 
            borderRadius: "50%", 
            background: "#00ff99",
            border: isDark ? "2px solid #0a0a0a" : "2px solid #fff",
            boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
          }} />
        </button>
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .hover-subtle:hover {
          background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,80,40,0.05)"};
        }
      `}</style>
    </header>
  );
}