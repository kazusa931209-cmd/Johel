import { Hono } from "hono";
import { z } from "zod";
import {
  loadExperienceIndex,
  runCombineRecommendCursor,
  runCombineRecommendOpenAi,
} from "../lib/ai-combine-recommend/index.js";
import { isAiProviderId, type AiProviderId } from "../lib/ai-provider.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_MAX = 10_000;
const KEYWORD_CONTEXT_MAX = 500;

const companySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  keywordContext: z.string().trim().max(KEYWORD_CONTEXT_MAX).optional(),
  experienceIds: z.array(z.string().trim().min(1)).default([]),
});

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_MAX),
  acceptedMarkdown: z.string().trim().max(JOB_MAX).optional(),
  profileId: z.string().trim().min(1),
  companies: z.array(companySchema).min(1),
});

export const aiCombineRecommendRoutes = new Hono();

aiCombineRecommendRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid Combine recommend payload." }, 400);
  }

  const setting = await prisma.setting.findUnique({
    where: { userId: user.id },
  });
  if (!setting?.apiKey || !setting.provider) {
    return c.json(
      {
        error:
          "AI Agent is not configured. Save a provider and API key in Settings first.",
      },
      400,
    );
  }

  if (!isAiProviderId(setting.provider)) {
    return c.json(
      { error: `Unsupported AI provider: ${setting.provider}` },
      400,
    );
  }

  const provider: AiProviderId = setting.provider;

  const profile = await prisma.profile.findFirst({
    where: { id: parsed.data.profileId, userId: user.id },
  });
  if (!profile) {
    return c.json({ error: "Selected profile was not found." }, 400);
  }

  const companyIds = parsed.data.companies.map((item) => item.companyId);
  const companies = await prisma.company.findMany({
    where: { userId: user.id, id: { in: companyIds } },
  });
  if (companies.length !== companyIds.length) {
    return c.json({ error: "One or more companies were not found." }, 400);
  }

  const companyById = new Map(companies.map((item) => [item.id, item]));
  const experienceIndex = await loadExperienceIndex(user.id);

  if (experienceIndex.length < 1) {
    return c.json(
      { error: "Add at least one experience in the workspace first." },
      400,
    );
  }

  const runInput = {
    apiKey: setting.apiKey,
    jobDescription: parsed.data.jobDescription,
    acceptedMarkdown: parsed.data.acceptedMarkdown,
    profileId: parsed.data.profileId,
    companies: parsed.data.companies.map((entry) => {
      const company = companyById.get(entry.companyId);
      if (!company) {
        throw new Error("Company was not found.");
      }
      return {
        companyId: entry.companyId,
        name: company.name,
        startDate: entry.startDate,
        endDate: entry.endDate,
        roleContext: entry.roleContext,
        keywordContext: entry.keywordContext?.trim(),
      };
    }),
    experienceIndex,
  };

  try {
    const result =
      provider === "openai"
        ? await runCombineRecommendOpenAi(runInput)
        : await runCombineRecommendCursor(runInput);

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "combineRecommend",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      ...result.result,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Combine recommendation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
