"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapPinIcon = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const BusIcon    = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>;
const WifiIcon   = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const WifiOffIcon= ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const RefreshIcon= ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

interface BusMarker { plate: string; lat: number; lon: number; occupancy: number; assignment_id: number; }

const ADDIS_CENTER: [number, number] = [9.0222, 38.7468];
const OCC_COLOR = ["var(--success)","var(--warning)","var(--danger)"];
const OCC_LABEL = ["Low","Medium","High"];

// Dynamically import Leaflet (no SSR)
const MapContainer  = dynamic(() => import("react-leaflet").then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import("react-leaflet").then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import("react-leaflet").then(m => m.Popup),         { ssr: false });

export function LiveMap() {
  const [buses, setBuses] = useState<BusMarker[]>([]);
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  // Setup WebSocket for live bus data
  useEffect(() => {
    setLoaded(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl  = apiUrl.replace(/^http/, "ws") + "/api/v1/ws/live";
    let ws: WebSocket;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen  = () => setConnected(true);
        ws.onclose = () => { setConnected(false); retry = setTimeout(connect, 5000); };
        ws.onerror = () => setConnected(false);
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === "bus_update" && d.data) {
              setBuses(prev => {
                const idx = prev.findIndex(b => b.plate === d.data.plate_number);
                const updated = { plate: d.data.plate_number, lat: d.data.lat, lon: d.data.lon, occupancy: d.data.occupancy_level, assignment_id: d.data.assignment_id };
                if (idx >= 0) { const n=[...prev]; n[idx]=updated; return n; }
                return [...prev, updated];
              });
              setLastPing(new Date());
            }
          } catch {}
        };
      } catch { setConnected(false); }
    };

    connect();
    return () => { ws?.close(); clearTimeout(retry); };
  }, []);

  if (!loaded) return (
    <div className="flex items-center justify-center h-full" style={{ background:"var(--bg-base)" }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor:"var(--border)", borderTopColor:"var(--brand)" }} />
    </div>
  );

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
      {/* Status bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg"
          style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
          <span style={{ color:connected?"var(--success)":"var(--danger)" }}>{connected?<WifiIcon/>:<WifiOffIcon/>}</span>
          <span style={{ color:"var(--text-primary)" }}>{connected?"WebSocket Live":"Disconnected"}</span>
          {buses.length > 0 && <span className="badge badge-green">{buses.length} buses</span>}
        </div>
        {lastPing && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs shadow-lg"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
            <RefreshIcon /> {lastPing.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Map */}
      <MapContainer center={ADDIS_CENTER} zoom={13} style={{ width:"100%", height:"100%", zIndex:1 }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {buses.map(bus => (
          <Marker key={bus.plate} position={[bus.lat, bus.lon]}>
            <Popup>
              <div style={{ fontFamily:"var(--font-sans)", minWidth:140 }}>
                <div className="flex items-center gap-1.5 mb-2 font-semibold" style={{ color:"var(--brand)" }}>
                  <BusIcon /> {bus.plate}
                </div>
                <div className="text-xs space-y-1" style={{ color:"var(--text-secondary)" }}>
                  <div className="flex items-center gap-1"><MapPinIcon />{bus.lat.toFixed(5)}, {bus.lon.toFixed(5)}</div>
                  <div>Occupancy: <span style={{ color:OCC_COLOR[bus.occupancy] || "var(--text-primary)", fontWeight:600 }}>{OCC_LABEL[bus.occupancy] ?? bus.occupancy}</span></div>
                  <div style={{ color:"var(--text-muted)" }}>Assignment #{bus.assignment_id}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* No buses overlay */}
      {buses.length === 0 && connected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
          <div className="rounded-2xl px-5 py-4 text-center shadow-xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>No active buses</p>
            <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>Start an assignment to see buses</p>
          </div>
        </div>
      )}
    </div>
  );
}
