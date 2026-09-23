import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { DEFAULT_PROMPTS } from "@johel/prompt-defaults";
import {
  COOKIE_NAME,
  hashPassword,
  normalizeLoginId,
  sessionCookieClearOptions,
  sessionCookieOptions,
  signSessionToken,
  verifyPassword,
} from "../lib/auth";
import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/session";
import { DEFAULT_GENERATION_PROCESS } from "./settings-process";

const credentialsSchema = z.object({
  loginId: z.string().trim().min(1).max(64),
  password: z.string().min(8).max(128),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid login ID or password" }, 400);
  }

  const loginId = normalizeLoginId(parsed.data.loginId);
  const existing = await prisma.user.findUnique({ where: { email: loginId } });
  if (existing) {
    return c.json({ error: "Login ID already registered" }, 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: loginId,
      passwordHash,
      generationProcess: {
        create: {
          doVerdict: DEFAULT_GENERATION_PROCESS.doVerdict,
          doEvaluate: DEFAULT_GENERATION_PROCESS.doEvaluate,
          resumeLanguage: DEFAULT_GENERATION_PROCESS.resumeLanguage,
          downloadFormat: DEFAULT_GENERATION_PROCESS.downloadFormat,
          experienceAdvisePoolDepth:
            DEFAULT_GENERATION_PROCESS.experienceAdvisePoolDepth,
          combineExperiencesPerCompanyMax:
            DEFAULT_GENERATION_PROCESS.combineExperiencesPerCompanyMax,
          combineExperiencesPerCompanyMin:
            DEFAULT_GENERATION_PROCESS.combineExperiencesPerCompanyMin,
          experienceDimensionMode:
            DEFAULT_GENERATION_PROCESS.experienceDimensionMode,
          experienceJdTierDecayPercent:
            DEFAULT_GENERATION_PROCESS.experienceJdTierDecayPercent,
        },
      },
      prompt: {
        create: {
          verdictPrompt: DEFAULT_PROMPTS.verdictPrompt,
          generatePrompt: DEFAULT_PROMPTS.generatePrompt,
          evaluatePrompt: DEFAULT_PROMPTS.evaluatePrompt,
          refinePrompt: DEFAULT_PROMPTS.refinePrompt,
        },
      },
    },
  });

  const token = await signSessionToken(user.id, user.email, user.sessionVersion);
  setCookie(c, COOKIE_NAME, token, sessionCookieOptions(c));

  return c.json(
    {
      id: user.id,
      loginId: user.email,
      role: user.role,
      currentGenerationPublicId: null,
    },
    201,
  );
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid login ID or password" }, 400);
  }

  const loginId = normalizeLoginId(parsed.data.loginId);
  const user = await prisma.user.findUnique({ where: { email: loginId } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "Invalid login ID or password" }, 401);
  }

  const token = await signSessionToken(user.id, user.email, user.sessionVersion);
  setCookie(c, COOKIE_NAME, token, sessionCookieOptions(c));

  return c.json({
    id: user.id,
    loginId: user.email,
    role: user.role,
    currentGenerationPublicId: null,
  });
});

authRoutes.put("/password", async (c) => {
  const sessionUser = await requireUser(c);
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid password" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const currentOk = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!currentOk) {
    return c.json({ error: "Current password is incorrect" }, 400);
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
    select: {
      id: true,
      email: true,
      role: true,
      sessionVersion: true,
    },
  });

  const token = await signSessionToken(
    updated.id,
    updated.email,
    updated.sessionVersion,
  );
  setCookie(c, COOKIE_NAME, token, sessionCookieOptions(c));

  return c.json({ ok: true });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, sessionCookieClearOptions(c));
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      currentGeneration: { select: { publicId: true } },
    },
  });
  if (!row) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    id: row.id,
    loginId: row.email,
    role: row.role,
    currentGenerationPublicId: row.currentGeneration?.publicId ?? null,
  });
});
