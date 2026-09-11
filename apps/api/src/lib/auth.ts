import bcrypt from "bcryptjs";
import type { Context } from "hono";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "johel_session";
const DEFAULT_SESSION_TTL = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

function getSessionTtl(): string {
  const configured = process.env.SESSION_TTL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_SESSION_TTL;
}

export function sessionMaxAgeSeconds(): number {
  const ttl = getSessionTtl();
  const dayMatch = ttl.match(/^(\d+)d$/);
  if (dayMatch) {
    return Number.parseInt(dayMatch[1], 10) * 60 * 60 * 24;
  }
  const hourMatch = ttl.match(/^(\d+)h$/);
  if (hourMatch) {
    return Number.parseInt(hourMatch[1], 10) * 60 * 60;
  }
  return 60 * 60 * 24 * 7;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signSessionToken(
  userId: string,
  email: string,
  sessionVersion: number,
): Promise<string> {
  return new SignJWT({ email, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(getSessionTtl())
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<{ userId: string; email: string; sessionVersion: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : null;
    const sessionVersion =
      typeof payload.sv === "number"
        ? payload.sv
        : typeof payload.sv === "string"
          ? Number.parseInt(payload.sv, 10)
          : 0;
    if (!userId || !email || !Number.isFinite(sessionVersion)) {
      return null;
    }
    return { userId, email, sessionVersion };
  } catch {
    return null;
  }
}

export function resolveSessionCookieSecure(c: Context): boolean {
  const override = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  const forwarded = c.req.header("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  }

  try {
    return new URL(c.req.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookieOptions(
  c: Context,
  maxAgeSeconds = sessionMaxAgeSeconds(),
) {
  return {
    httpOnly: true,
    secure: resolveSessionCookieSecure(c),
    sameSite: "Lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function sessionCookieClearOptions(c: Context) {
  return {
    path: "/",
    secure: resolveSessionCookieSecure(c),
  };
}

export { COOKIE_NAME };

export function normalizeLoginId(loginId: string): string {
  return loginId.trim().toLowerCase();
}

/** @deprecated Use normalizeLoginId — DB column is still `email`. */
export function normalizeEmail(email: string): string {
  return normalizeLoginId(email);
}
