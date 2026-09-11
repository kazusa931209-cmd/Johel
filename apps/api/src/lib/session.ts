import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { COOKIE_NAME, verifySessionToken } from "./auth.js";
import { decryptApiKeyFromStorage } from "./secrets/api-key.js";
import { prisma } from "./prisma.js";

export async function requireUser(c: Context) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== session.sessionVersion) {
    return null;
  }

  return user;
}

export function maskApiKey(apiKey: string): string {
  const plaintext = decryptApiKeyFromStorage(apiKey);
  if (plaintext.length <= 8) {
    return "********";
  }
  const prefix = plaintext.slice(0, 4);
  const suffix = plaintext.slice(-4);
  return `${prefix} ******** ${suffix}`;
}
