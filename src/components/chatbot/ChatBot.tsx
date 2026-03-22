"use client";
import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2"/></svg>;
const SendIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" strokeWidth="2" fill="none"/></svg>;
const BotIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="10" rx="2" stroke="white" strokeWidth="1.8"/><circle cx="12" cy="5" r="2" stroke="white" strokeWidth="1.8"/><path d="M12 7v4" stroke="white" strokeWidth="1.8"/><line x1="8" y1="15" x2="8" y2="15.01" stroke="white" strokeWidth="1.8"/><line x1="12" y1="15" x2="12" y2="15.01" stroke="white" strokeWidth="1.8"/><line x1="16" y1="15" x2="16" y2="15.01" stroke="white" strokeWidth="1.8"/></svg>;
const ChevUpIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="18 15 12 9 6 15" stroke="white" strokeWidth="2"/></svg>;

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM_PROMPT = `You are BusTrack Admin Assistant — a helpful AI embedded in the BusTrack fleet management dashboard.

You help admins understand and operate the system. Here is what you know about BusTrack:

SYSTEM OVERVIEW:
BusTrack is a real-time public transport tracking & density prediction system for Addis Ababa, built with FastAPI backend + Next.js admin dashboard.

FEATURES:
- Dashboard: Live fleet KPIs — active trips, vehicles, routes, users, telemetry pings in last 24h, ETA accuracy comparison
- Vehicles: Register buses by plate number & SIM7600 IMEI device ID
- Routes & Stops: Create routes with route numbers (e.g. 121), link stops with GPS coordinates, dwell time, peak multipliers
- Live Assignments: Admin-view of currently active driver trips (read-only). Drivers start/end their own trips via mobile app. Admins can force-end trips.
- Drivers & Users: Create driver/admin accounts (passengers sign up themselves via mobile app)
- Analytics: Charts for assignments over time, telemetry volume, occupancy distribution, route usage, ETA model comparison
- Settings & ML: Train RandomForest ML model on trip history, toggle between heuristic ETA vs ML ETA, run data cleanup

ETA SYSTEM:
- Heuristic: haversine distance / speed + dwell time × peak multiplier × occupancy factor
- ML: RandomForest trained on (stop_id, hour, day_of_week, is_peak_hour, occupancy_level) → actual_travel_time
- Min 50 samples needed to train. Admin toggles which mode is used in Settings.
- Both run in parallel; MAE compared in Analytics.

HARDWARE:
- SIM7600 GPS/GSM module sends latitude, longitude, pixel_count via POST /api/v1/telemetry
- ESP32-CAM pixel_count → occupancy level (0=Low <3000px, 1=Medium 3000-7000px, 2=High >7000px)
- Last 5 GPS points buffered in Redis for outlier rejection (haversine > 500m spike = rejected)

DATABASE:
- PostgreSQL: users, vehicles, routes, stops, route_stops, assignments, raw_telemetry, trip_history, model_performance, favorites, ratings, notification_settings, system_settings
- Redis: bus:live:{plate} hash (lat, lon, speed, occupancy, assignment_id), bus:coords:{plate} list (last 5 coords), active_buses GEO index, route:{no}:stop:{id} ETA cache

API ENDPOINTS (all under /api/v1):
- POST /auth/login — JWT login
- GET /admin/dashboard/summary — fleet stats
- POST /vehicles — register vehicle (admin)
- POST /routes — create route (admin)
- POST /stops — create stop (admin)
- POST /assignments/start — start trip (driver)
- POST /assignments/end — end trip (driver/admin)
- POST /admin/ml/train — retrain ML model
- POST /admin/cleanup — delete old telemetry/history
- GET /admin/settings — get use_ml_for_prod flag
- PUT /admin/settings — toggle ML mode
- POST /search/point-to-point — find routes between two stops

ROLES: admin (full access), driver (start/end own trips), passenger (mobile app only)

TIPS FOR ADMINS:
- To get ML working: collect 50+ real trips first, then click Train Model in Settings
- To register a new bus: go to Vehicles → Register Vehicle, enter plate + SIM7600 IMEI
- To add a route: Routes & Stops → New Route, set route number, origin, destination
- Drivers sign up via admin creating them in Drivers & Users section
- Data cleanup runs retention policy: 30 days raw telemetry, 365 days trip history

Be concise, friendly, and practical. If asked something outside BusTrack, politely redirect.`;

const QUICK = [
  "How do I register a new bus?",
  "How does the ML model work?",
  "How do drivers start a trip?",
  "What is the ETA calculation?",
  "How do I add a route?",
  "Why is my telemetry not showing?",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the BusTrack assistant. Ask me anything about the system — vehicles, routes, ML, API, or how things work." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10),
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Check your console or API route." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: "#2563eb", color: "#fff" }}
      >
        {open ? <CloseIcon /> : <BotIcon />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[360px] h-[520px] bg-[#0f172a] rounded-2xl shadow-2xl flex flex-col border border-[#1e293b]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#1e293b] text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <BotIcon />
              <div className="text-sm font-semibold">BusTrack Assistant</div>
            </div>
            <button onClick={() => setOpen(false)}>
              <ChevUpIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[#020617]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-[13px] px-3 py-2 rounded-2xl ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-[#1e293b] text-gray-100 border border-[#334155]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-[#1e293b] border border-[#334155] flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:.2s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:.4s]"></span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2">
              <div className="text-xs text-gray-400 mb-2">Quick Questions</div>
              <div className="flex flex-wrap gap-2">
                {QUICK.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-2 py-1 border rounded-lg bg-[#020617] border-[#334155] text-gray-300 hover:border-blue-500 hover:text-blue-400"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-3 py-2 border-t border-[#1e293b] flex gap-2 bg-[#0f172a]">
            <input
              className="flex-1 text-sm border border-[#334155] rounded-lg px-2 py-1 outline-none bg-[#020617] text-white placeholder-gray-500"
              placeholder="Ask about BusTrack…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-3 rounded-lg flex items-center justify-center"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}