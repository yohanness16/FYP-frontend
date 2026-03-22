"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatBot } from "@/components/chatbot/ChatBot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();
  const W = collapsed ? 72 : 248;
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (loading) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-base)" }}><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:"var(--border)", borderTopColor:"var(--brand)" }} /></div>;
  if (!user) return null;
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)" }}>
      <Sidebar />
      <div className="main-transition flex flex-col" style={{ marginLeft:W, minHeight:"100vh" }}>
        <Topbar />
        <main style={{ flex:1, padding:"1.25rem" }}>{children}</main>
      </div>
      <ChatBot />
    </div>
  );
}
