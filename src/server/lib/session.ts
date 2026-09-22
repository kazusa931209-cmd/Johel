import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { COOKIE_NAME, verifySessionToken } from "./auth";
import { decryptApiKeyFromStorage } from "./secrets/api-key";
import { prisma } from "./prisma";

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
  let plaintext: string;
  try {
    plaintext = decryptApiKeyFromStorage(apiKey);
  } catch {
    return "********";
  }
  if (plaintext.length <= 8) {
    return "********";
  }
  const prefix = plaintext.slice(0, 4);
  const suffix = plaintext.slice(-4);
  return `${prefix} ******** ${suffix}`;
}
