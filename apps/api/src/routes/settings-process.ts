import { Hono } from "hono";
import { z } from "zod";
import { EXPERIENCE_ADVISE_POOL_DEPTHS } from "../lib/experience-embedding/pool-depth.js";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const RESUME_LANGUAGES = ["en", "ja", "zh-TW", "zh-CN", "ko"] as const;

const putSchema = z.object({
  doVerdict: z.boolean(),
  doEvaluate: z.boolean(),
  resumeLanguage: z.enum(RESUME_LANGUAGES),
  experienceAdvisePoolDepth: z.enum(EXPERIENCE_ADVISE_POOL_DEPTHS),
});

export const DEFAULT_GENERATION_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
  resumeLanguage: "en",
  experienceAdvisePoolDepth: "normal",
} as const;

function toProcessResponse(
  process: {
    doVerdict: boolean;
    doEvaluate: boolean;
    resumeLanguage: string;
    experienceAdvisePoolDepth: string;
  } | null,
) {
  const resumeLanguage = process?.resumeLanguage ?? DEFAULT_GENERATION_PROCESS.resumeLanguage;
  const experienceAdvisePoolDepth =
    process?.experienceAdvisePoolDepth ??
    DEFAULT_GENERATION_PROCESS.experienceAdvisePoolDepth;
  return {
    doVerdict: process?.doVerdict ?? DEFAULT_GENERATION_PROCESS.doVerdict,
    doEvaluate: process?.doEvaluate ?? DEFAULT_GENERATION_PROCESS.doEvaluate,
    resumeLanguage: RESUME_LANGUAGES.includes(
      resumeLanguage as (typeof RESUME_LANGUAGES)[number],
    )
      ? resumeLanguage
      : DEFAULT_GENERATION_PROCESS.resumeLanguage,
    experienceAdvisePoolDepth: EXPERIENCE_ADVISE_POOL_DEPTHS.includes(
      experienceAdvisePoolDepth as (typeof EXPERIENCE_ADVISE_POOL_DEPTHS)[number],
    )
      ? experienceAdvisePoolDepth
      : DEFAULT_GENERATION_PROCESS.experienceAdvisePoolDepth,
  };
}

export const settingsProcessRoutes = new Hono();

settingsProcessRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const process = await prisma.generationProcess.findUnique({
    where: { userId: user.id },
  });

  return c.json(toProcessResponse(process));
});

settingsProcessRoutes.put("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid process settings." }, 400);
  }

  const process = await prisma.generationProcess.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
      resumeLanguage: parsed.data.resumeLanguage,
      experienceAdvisePoolDepth: parsed.data.experienceAdvisePoolDepth,
    },
    update: {
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
      resumeLanguage: parsed.data.resumeLanguage,
      experienceAdvisePoolDepth: parsed.data.experienceAdvisePoolDepth,
    },
  });

  return c.json(toProcessResponse(process));
});
