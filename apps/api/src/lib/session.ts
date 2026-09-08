import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { COOKIE_NAME, verifySessionToken } from "./auth.js";
import { prisma } from "./prisma.js";

export async function requireUser(c: Context) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true },
  });
  return user;
}

export function maskApiKey(apiKey: string): string {
  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix} ******** ${suffix}`;
}
