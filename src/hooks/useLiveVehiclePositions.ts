"use client";

import { useEffect, useRef, useState } from "react";
import { getFleetWebSocketUrl } from "@/lib/wsUrl";
import type { VehiclePosition } from "@/types";

type WsStatus = "idle" | "connecting" | "open" | "error";

function mergePosition(
  prev: Record<string, VehiclePosition>,
  msg: Record<string, unknown>
): Record<string, VehiclePosition> {
  if (msg.type !== "vehicle_position") return prev;
  const vid = msg.vehicle_id;
  if (typeof vid !== "number") return prev;
  const key = String(vid);
  const lat = Number(msg.lat);
  const lon = Number(msg.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return prev;
  const next: VehiclePosition = {
    vehicle_id: vid,
    plate_number: String(msg.plate_number ?? ""),
    lat,
    lon,
    speed: Number(msg.speed) || 0,
    timestamp: Number(msg.timestamp) || Date.now() / 1000,
    route_id:
      msg.route_id === null || msg.route_id === undefined
        ? null
        : Number(msg.route_id),
  };
  return { ...prev, [key]: next };
}

/**
 * Subscribes to admin WebSocket fleet stream; merges `vehicle_position` into a positions map.
 */
export function useLiveVehiclePositions(enabled: boolean) {
  const [wsPositions, setWsPositions] = useState<Record<string, VehiclePosition>>({});
  const [status, setStatus] = useState<WsStatus>("idle");
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setWsPositions({});
      setStatus("idle");
      return;
    }

    const rawToken = localStorage.getItem("token");
    if (!rawToken) {
      setWsPositions({});
      setStatus("idle");
      return;
    }
    const token = rawToken;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    function scheduleReconnect() {
      clearReconnect();
      if (cancelled) return;
      attemptRef.current += 1;
      const delay = Math.min(30000, 2000 * Math.pow(2, Math.min(attemptRef.current, 5)));
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      if (cancelled) return;
      clearReconnect();
      ws?.close();
      ws = null;
      setStatus("connecting");
      const url = getFleetWebSocketUrl(token);
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        setStatus("error");
        scheduleReconnect();
        return;
      }
      ws = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setStatus("open");
        attemptRef.current = 0;
      };

      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as Record<string, unknown>;
          if (data.type === "vehicle_position") {
            setWsPositions((p) => mergePosition(p, data));
          }
        } catch {
          /* ignore */
        }
      };

      socket.onerror = () => {
        if (!cancelled) setStatus("error");
      };

      socket.onclose = () => {
        if (ws === socket) ws = null;
        if (!cancelled) {
          setStatus("error");
          scheduleReconnect();
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      ws?.close();
    };
  }, [enabled]);

  return { wsPositions, wsStatus: status };
}
