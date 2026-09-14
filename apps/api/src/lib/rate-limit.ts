import type { Context, MiddlewareHandler } from "hono";
import { getClientIp } from "./client-ip.js";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function consume(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= max) {
    return false;
  }

  existing.count += 1;
  return true;
}

function retryAfterSeconds(bucketKey: string): number {
  const bucket = buckets.get(bucketKey);
  if (!bucket) {
    return 60;
  }
  return Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}

export function createRateLimiter(input: {
  group: string;
  windowMs: number;
  max: number;
  key: (c: Context) => string | null;
}): MiddlewareHandler {
  return async (c, next) => {
    const identity = input.key(c);
    if (!identity) {
      return await next();
    }

    const bucketKey = `${input.group}:${identity}`;
    const allowed = consume(bucketKey, input.max, input.windowMs);
    if (!allowed) {
      c.header("Retry-After", String(retryAfterSeconds(bucketKey)));
      return c.json({ error: "Too many requests. Try again later." }, 429);
    }

    return await next();
  };
}

export function authLoginRateLimit(): MiddlewareHandler {
  return createRateLimiter({
    group: "auth:login",
    windowMs: 15 * 60 * 1000,
    max: envInt("RATE_LIMIT_AUTH_LOGIN", 10),
    key: (c) => getClientIp(c),
  });
}

export function authRegisterRateLimit(): MiddlewareHandler {
  return createRateLimiter({
    group: "auth:register",
    windowMs: 60 * 60 * 1000,
    max: envInt("RATE_LIMIT_AUTH_REGISTER", 5),
    key: (c) => getClientIp(c),
  });
}

export function authPasswordRateLimit(): MiddlewareHandler {
  return createRateLimiter({
    group: "auth:password",
    windowMs: 60 * 60 * 1000,
    max: envInt("RATE_LIMIT_AUTH_PASSWORD", 5),
    key: (c) => c.get("rateLimitUserId") ?? null,
  });
}

export function defaultApiRateLimit(): MiddlewareHandler {
  return createRateLimiter({
    group: "api:default",
    windowMs: 15 * 60 * 1000,
    max: envInt("RATE_LIMIT_API_DEFAULT", 300),
    key: (c) => getClientIp(c),
  });
}

export function aiRateLimit(): MiddlewareHandler {
  return createRateLimiter({
    group: "ai",
    windowMs: 60 * 60 * 1000,
    max: envInt("RATE_LIMIT_AI", 30),
    key: (c) => {
      const userId = c.get("rateLimitUserId");
      if (typeof userId === "string" && userId.length > 0) {
        return userId;
      }
      return `ip:${getClientIp(c)}`;
    },
  });
}

export function resetRateLimitStoreForTests(): void {
  buckets.clear();
}
