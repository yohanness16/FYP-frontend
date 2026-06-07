"use client";

/**
 * Safely renders any value as a string.
 * Prevents React error #31 when API returns unexpected objects.
 */
export function SafeText({ value, fallback = "—" }: { value: unknown; fallback?: string }) {
  if (value === null || value === undefined) return <>{fallback}</>;
  if (typeof value === "string") return <>{value}</>;
  if (typeof value === "number" || typeof value === "boolean") return <>{String(value)}</>;
  // If it's an object/array, try to extract a meaningful string
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === "string") return <>{obj.name}</>;
    if (typeof obj.msg === "string") return <>{obj.msg}</>;
    if (typeof obj.detail === "string") return <>{obj.detail}</>;
    if (typeof obj.title === "string") return <>{obj.title}</>;
    if (typeof obj.label === "string") return <>{obj.label}</>;
    if (typeof obj.id === "number") return <>{String(obj.id)}</>;
    // Last resort: JSON stringify (truncated)
    try {
      const str = JSON.stringify(value);
      return <>{str.length > 100 ? str.slice(0, 100) + "…" : str}</>;
    } catch {
      return <>{fallback}</>;
    }
  }
  return <>{fallback}</>;
}
