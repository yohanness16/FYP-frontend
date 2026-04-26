/** WebSocket URL for admin fleet stream (same host as API unless overridden). */

export function getFleetWebSocketUrl(token: string): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) {
    const u = new URL(explicit);
    u.searchParams.set("token", token);
    return u.toString();
  }
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const u = new URL(api);
  const wsProto = u.protocol === "https:" ? "wss" : "ws";
  const enc = encodeURIComponent(token);
  return `${wsProto}://${u.host}/api/v1/ws/live?token=${enc}`;
}
