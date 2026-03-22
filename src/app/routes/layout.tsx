
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
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg-base)" }}><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:"var(--border)", borderTopColor:"var(--brand)" }} /></div>;
  if (!user) return null;
  return (
    <div className="min-h-screen" style={{ background:"var(--bg-base)" }}>
      <Sidebar />
      <div className="sidebar-transition flex flex-col min-h-screen" style={{ marginLeft: collapsed ? 64 : 240 }}>
        <Topbar />
        <main className="flex-1 p-5">{children}</main>
      </div>
      <ChatBot />
    </div>
  );
}

