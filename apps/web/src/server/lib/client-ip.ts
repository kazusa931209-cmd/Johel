import type { Context } from "hono";

export function getClientIp(c: Context): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) {
        return first;
      }
    }
  }

  const direct = c.req.header("x-real-ip")?.trim();
  if (direct) {
    return direct;
  }

  return "unknown";
}
