import { Hono } from "hono";
import { z } from "zod";
import { normalizeCombineExperiencesPerCompanyMax } from "../lib/combine-experiences-per-company";
import { EXPERIENCE_ADVISE_POOL_DEPTHS } from "../lib/experience-embedding/pool-depth";
import {
  DEFAULT_EXPERIENCE_DIMENSION_MODE,
  DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
  EXPERIENCE_DIMENSION_MODES,
  normalizeExperienceDimensionMode,
  normalizeExperienceJdTierDecayPercent,
} from "../lib/resume-generation-policy";
import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/session";

const RESUME_LANGUAGES = ["en", "ja", "zh-TW", "zh-CN", "ko"] as const;
const DOWNLOAD_FORMATS = ["docx", "pdf"] as const;

const putSchema = z.object({
  doVerdict: z.boolean(),
  doEvaluate: z.boolean(),
  resumeLanguage: z.enum(RESUME_LANGUAGES),
  downloadFormat: z.enum(DOWNLOAD_FORMATS),
  experienceAdvisePoolDepth: z.enum(EXPERIENCE_ADVISE_POOL_DEPTHS),
  combineExperiencesPerCompanyMax: z.number().int().min(1).max(10),
  experienceDimensionMode: z.enum(EXPERIENCE_DIMENSION_MODES),
  experienceJdTierDecayPercent: z.union([
    z.literal(30),
    z.literal(50),
    z.literal(70),
    z.literal(80),
  ]),
});

export const DEFAULT_GENERATION_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
  resumeLanguage: "en",
  downloadFormat: "docx",
  experienceAdvisePoolDepth: "normal",
  combineExperiencesPerCompanyMax: 5,
  experienceDimensionMode: DEFAULT_EXPERIENCE_DIMENSION_MODE,
  experienceJdTierDecayPercent: DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
} as const;

export function normalizeDownloadFormat(
  resumeLanguage: string,
  downloadFormat: string | undefined,
): (typeof DOWNLOAD_FORMATS)[number] {
  if (resumeLanguage !== "en") {
    return "docx";
  }
  return DOWNLOAD_FORMATS.includes(
    downloadFormat as (typeof DOWNLOAD_FORMATS)[number],
  )
    ? (downloadFormat as (typeof DOWNLOAD_FORMATS)[number])
    : DEFAULT_GENERATION_PROCESS.downloadFormat;
}

function toProcessResponse(
  process: {
    doVerdict: boolean;
    doEvaluate: boolean;
    resumeLanguage: string;
    downloadFormat?: string;
    experienceAdvisePoolDepth: string;
    combineExperiencesPerCompanyMax?: number | null;
    experienceDimensionMode?: string | null;
    experienceJdTierDecayPercent?: number | null;
  } | null,
) {
  const resumeLanguage = process?.resumeLanguage ?? DEFAULT_GENERATION_PROCESS.resumeLanguage;
  const normalizedResumeLanguage = RESUME_LANGUAGES.includes(
    resumeLanguage as (typeof RESUME_LANGUAGES)[number],
  )
    ? resumeLanguage
    : DEFAULT_GENERATION_PROCESS.resumeLanguage;
  const experienceAdvisePoolDepth =
    process?.experienceAdvisePoolDepth ??
    DEFAULT_GENERATION_PROCESS.experienceAdvisePoolDepth;
  return {
    doVerdict: process?.doVerdict ?? DEFAULT_GENERATION_PROCESS.doVerdict,
    doEvaluate: process?.doEvaluate ?? DEFAULT_GENERATION_PROCESS.doEvaluate,
    resumeLanguage: normalizedResumeLanguage,
    downloadFormat: normalizeDownloadFormat(
      normalizedResumeLanguage,
      process?.downloadFormat,
    ),
    experienceAdvisePoolDepth: EXPERIENCE_ADVISE_POOL_DEPTHS.includes(
      experienceAdvisePoolDepth as (typeof EXPERIENCE_ADVISE_POOL_DEPTHS)[number],
    )
      ? experienceAdvisePoolDepth
      : DEFAULT_GENERATION_PROCESS.experienceAdvisePoolDepth,
    combineExperiencesPerCompanyMax: normalizeCombineExperiencesPerCompanyMax(
      process?.combineExperiencesPerCompanyMax,
    ),
    experienceDimensionMode: normalizeExperienceDimensionMode(
      process?.experienceDimensionMode,
    ),
    experienceJdTierDecayPercent: normalizeExperienceJdTierDecayPercent(
      process?.experienceJdTierDecayPercent,
    ),
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

  const downloadFormat = normalizeDownloadFormat(
    parsed.data.resumeLanguage,
    parsed.data.downloadFormat,
  );

  const process = await prisma.generationProcess.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
      resumeLanguage: parsed.data.resumeLanguage,
      downloadFormat,
      experienceAdvisePoolDepth: parsed.data.experienceAdvisePoolDepth,
      combineExperiencesPerCompanyMax: parsed.data.combineExperiencesPerCompanyMax,
      experienceDimensionMode: parsed.data.experienceDimensionMode,
      experienceJdTierDecayPercent: parsed.data.experienceJdTierDecayPercent,
    },
    update: {
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
      resumeLanguage: parsed.data.resumeLanguage,
      downloadFormat,
      experienceAdvisePoolDepth: parsed.data.experienceAdvisePoolDepth,
      combineExperiencesPerCompanyMax: parsed.data.combineExperiencesPerCompanyMax,
      experienceDimensionMode: parsed.data.experienceDimensionMode,
      experienceJdTierDecayPercent: parsed.data.experienceJdTierDecayPercent,
    },
  });

  return c.json(toProcessResponse(process));
});
