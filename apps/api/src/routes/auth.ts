import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { DEFAULT_PROMPTS } from "@johel/prompt-defaults";
import {
  COOKIE_NAME,
  hashPassword,
  normalizeEmail,
  sessionCookieOptions,
  signSessionToken,
  verifyPassword,
} from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { DEFAULT_GENERATION_PROCESS } from "./settings-process.js";

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid email or password" }, 400);
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      generationProcess: {
        create: {
          doVerdict: DEFAULT_GENERATION_PROCESS.doVerdict,
          doEvaluate: DEFAULT_GENERATION_PROCESS.doEvaluate,
          resumeLanguage: DEFAULT_GENERATION_PROCESS.resumeLanguage,
        },
      },
      prompt: {
        create: {
          verdictPrompt: DEFAULT_PROMPTS.verdictPrompt,
          generatePrompt: DEFAULT_PROMPTS.generatePrompt,
          evaluatePrompt: DEFAULT_PROMPTS.evaluatePrompt,
        },
      },
    },
  });

  const token = await signSessionToken(user.id, user.email);
  setCookie(c, COOKIE_NAME, token, sessionCookieOptions());

  return c.json({ id: user.id, email: user.email, role: user.role }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid email or password" }, 400);
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await signSessionToken(user.id, user.email);
  setCookie(c, COOKIE_NAME, token, sessionCookieOptions());

  return c.json({ id: user.id, email: user.email, role: user.role });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(user);
});
