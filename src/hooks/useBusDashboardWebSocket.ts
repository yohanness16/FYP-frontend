"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getFleetWebSocketUrl } from "@/lib/wsUrl";
import type { VehiclePosition, CvData } from "@/types";

type WsStatus = "idle" | "connecting" | "open" | "error";

interface BusDashboardLiveState {
  position: VehiclePosition | null;
  cvData: CvData | null;
  status: WsStatus;
}

/**
 * Connects to the admin WebSocket fleet stream and filters messages
 * for a specific vehicle. Provides live position + CV crowd data.
 */
export function useBusDashboardWebSocket(
  enabled: boolean,
  vehicleId: number | null,
) {
  const [state, setState] = useState<BusDashboardLiveState>({
    position: null,
    cvData: null,
    status: "idle",
  });

  const attemptRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const clearReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || vehicleId == null || typeof window === "undefined") {
      setState({ position: null, cvData: null, status: "idle" });
      return;
    }

    const rawToken = localStorage.getItem("token");
    if (!rawToken) {
      setState({ position: null, cvData: null, status: "idle" });
      return;
    }

    const token: string = rawToken;

    cancelledRef.current = false;
    attemptRef.current = 0;

    function scheduleReconnect() {
      clearReconnect();
      if (cancelledRef.current) return;
      attemptRef.current += 1;
      const delay = Math.min(
        30000,
        2000 * Math.pow(2, Math.min(attemptRef.current, 5)),
      );
      reconnectTimerRef.current = setTimeout(connect, delay);
    }

    function connect() {
      if (cancelledRef.current) return;
      clearReconnect();
      wsRef.current?.close();
      wsRef.current = null;

      setState((s) => ({ ...s, status: "connecting" }));

      const url = getFleetWebSocketUrl(token);
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        setState((s) => ({ ...s, status: "error" }));
        scheduleReconnect();
        return;
      }
      wsRef.current = socket;

      socket.onopen = () => {
        if (cancelledRef.current) return;
        attemptRef.current = 0;
        setState((s) => ({ ...s, status: "open" }));
      };

      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as Record<string, unknown>;
          const msgType = data.type as string;

          if (msgType === "vehicle_position") {
            const vid = data.vehicle_id;
            if (typeof vid === "number" && vid === vehicleId) {
              const lat = Number(data.lat);
              const lon = Number(data.lon);
              if (Number.isFinite(lat) && Number.isFinite(lon)) {
                setState((s) => ({
                  ...s,
                  position: {
                    vehicle_id: vid,
                    plate_number: String(data.plate_number ?? ""),
                    lat,
                    lon,
                    speed: Number(data.speed) || 0,
                    timestamp: Number(data.timestamp) || Date.now() / 1000,
                    route_id:
                      data.route_id === null || data.route_id === undefined
                        ? null
                        : Number(data.route_id),
                  },
                }));
              }
            }
          }

          if (msgType === "cv_result") {
            const vid = data.vehicle_id;
            if (typeof vid === "number" && vid === vehicleId) {
              const cv = (data.cv as Record<string, unknown>) ?? {};
              setState((s) => ({
                ...s,
                cvData: {
                  people_count: Number(cv.people_count) || 0,
                  crowd_density: Number(cv.crowd_density) || 0,
                  is_crowded: Boolean(cv.is_crowded),
                  method: String(cv.method ?? "unknown"),
                  confidence: Number(cv.confidence) || 0,
                  foreground_ratio: Number(cv.foreground_ratio) || 0,
                  image_path: (data.image_path as string) ?? null,
                },
              }));
            }
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      socket.onerror = () => {
        if (!cancelledRef.current) {
          setState((s) => ({ ...s, status: "error" }));
        }
      };

      socket.onclose = () => {
        if (wsRef.current === socket) wsRef.current = null;
        if (!cancelledRef.current) {
          setState((s) => ({ ...s, status: "error" }));
          scheduleReconnect();
        }
      };
    }

    connect();

    return () => {
      cancelledRef.current = true;
      clearReconnect();
      wsRef.current?.close();
    };
  }, [enabled, vehicleId, clearReconnect]);

  return state;
}
