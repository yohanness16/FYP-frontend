"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ChevronDown, MessageSquare } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

const QUICK = [
  "How do I register a bus?",
  "How does ML ETA work?",
  "How to start a trip?",
  "Explain occupancy levels",
];

const SYSTEM_PROMPT = `You are BusTrack Admin Assistant — an AI embedded in the BusTrack fleet management dashboard for Addis Ababa's public transport system.

SYSTEM: FastAPI backend, Next.js admin dashboard, PostgreSQL + Redis.
HARDWARE: SIM7600 GPS modules, ESP32-CAM for density detection.
FEATURES: Real-time GPS tracking, occupancy (Low/Med/High), ML vs heuristic ETA, driver assignments, route management.

API ENDPOINTS (/api/v1):
- POST /auth/login — JWT auth
- GET /admin/dashboard/summary — fleet stats
- POST /vehicles — register vehicle (admin)
- POST /routes, /stops — create routes/stops (admin)
- POST /assignments/start|end — manage trips
- POST /admin/ml/train — retrain ML model
- POST /admin/cleanup — data retention
- GET|PUT /admin/settings — ML toggle

ROLES: admin (full), driver (start/end own trips), passenger (mobile app only).
ML: RandomForest needs 50+ trip_history samples. Toggle in Settings page.
OCCUPANCY: 0=Low (<3000px), 1=Medium (3000-7000px), 2=High (>7000px).
ETA: Heuristic=haversine+dwell+peak multiplier. ML=trained on historical patterns.

Be concise and practical. Redirect non-BusTrack questions politely.`;


export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi Yohannes! I'm your BusTrack assistant. How can I help with the fleet today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: messages.slice(-8), systemPrompt: SYSTEM_PROMPT }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text || "I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Integrated FAB */}
      <button onClick={() => setOpen(o => !o)}
        style={{ 
          position: "fixed", bottom: 24, right: 24, zIndex: 9999, 
          width: 48, height: 48, borderRadius: 12, 
          background: open ? "var(--bg-3)" : "var(--neon)", 
          border: "1px solid var(--border-2)", cursor: "pointer", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", transition: "all 0.3s ease", 
          color: open ? "var(--text)" : "#000" 
        }}>
        {open ? <X size={20} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div style={{ 
          position: "fixed", bottom: 84, right: 24, zIndex: 9998, 
          width: 380, height: 550, 
          // Glassmorphism UI
          background: "rgba(15, 15, 15, 0.85)", 
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)", 
          borderRadius: 20, display: "flex", flexDirection: "column", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>

          {/* Header */}
          <div style={{ 
            display: "flex", alignItems: "center", padding: "16px 20px", 
            background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" 
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neon)", marginRight: 12, boxShadow: "0 0 8px var(--neon)" }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>BusTrack Intelligence</h3>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", fontSize: 13, padding: "12px 16px", 
                  borderRadius: m.role === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px", 
                  lineHeight: 1.6,
                  // Dark themed bubbles
                  background: m.role === "user" ? "var(--neon)" : "rgba(255,255,255,0.06)",
                  color: m.role === "user" ? "#000" : "#ececec",
                  border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.05)" : "none",
                  boxShadow: m.role === "user" ? "0 4px 12px rgba(0,255,153,0.2)" : "none"
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "var(--text-4)", fontSize: 11, marginLeft: 4 }}>System is thinking...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Quick Actions Integration */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} style={{ 
                  fontSize: 10, padding: "6px 12px", borderRadius: 8, 
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", 
                  color: "var(--text-3)", cursor: "pointer" 
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "4px 4px 4px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === "Enter" && send(input)}
                placeholder="Type a command..." 
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13, outline: "none" }} 
              />
              <button onClick={() => send(input)} disabled={!input.trim()}
                style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: input.trim() ? "var(--neon)" : "transparent", 
                  color: input.trim() ? "#000" : "var(--text-4)", 
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}