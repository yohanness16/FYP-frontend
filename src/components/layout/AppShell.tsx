"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatBot } from "@/components/chatbot/ChatBot";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();
  const W = collapsed ? 64 : 232;

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--neon)", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div className="sidebar-transition" style={{ marginLeft: W, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Topbar />
        <main style={{ flex: 1, padding: "20px", maxWidth: "100%" }}>{children}</main>
      </div>
      <ChatBot />
    </div>
  );
}
