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

    // detail is an array of validation error objects — extract first message
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") {
        return first.msg;
      }
      // Fallback: join all messages
      const msgs = detail
        .filter((d: unknown) => d && typeof d === "object" && "msg" in d && typeof (d as { msg: unknown }).msg === "string")
        .map((d: { msg: string }) => d.msg);
      if (msgs.length > 0) return msgs.join("; ");
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
