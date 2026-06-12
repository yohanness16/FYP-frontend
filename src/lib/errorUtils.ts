/**
 * Safely extract a human-readable error string from any error object.
 * Handles Axios errors (with FastAPI validation errors), standard Errors, and unknown types.
 *
 * FastAPI validation errors return:
 *   { detail: [{ type, loc, msg, input }, ...] }
 *
 * FastAPI HTTPException returns:
 *   { detail: "some string" }
 *
 * Axios wraps these in err.response.data
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (!err) return fallback;

  // Axios error with response data
  const axiosErr = err as { response?: { data?: { detail?: unknown }; status?: number }; message?: string };
  if (axiosErr.response?.data) {
    const detail = axiosErr.response.data.detail;

    // detail is a string — use it directly
    if (typeof detail === "string") return detail;

    // detail is an array of validation error objects — show all messages with location
    if (Array.isArray(detail) && detail.length > 0) {
      const msgs = detail.map((d: unknown) => {
        if (d && typeof d === "object") {
          const obj = d as { msg?: string; loc?: unknown; type?: string; input?: unknown };
          const parts: string[] = [];
          if (obj.msg) parts.push(obj.msg);
          if (obj.loc) parts.push(`(at: ${Array.isArray(obj.loc) ? obj.loc.join(" → ") : obj.loc})`);
          if (obj.type && !obj.msg) parts.push(`[${obj.type}]`);
          return parts.length > 0 ? parts.join(" ") : JSON.stringify(d);
        }
        return String(d);
      });
      return msgs.join("; ");
    }

    // detail is an unknown object — try to stringify
    if (typeof detail === "object" && detail !== null) {
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }
  }

  // Standard Error
  if (err instanceof Error && err.message) return err.message;

  // String error
  if (typeof err === "string") return err;

  return fallback;
}
