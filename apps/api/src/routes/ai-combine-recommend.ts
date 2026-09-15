import { Hono } from "hono";
import { z } from "zod";
import { loadCombineRecommendInputFromGeneration } from "../lib/ai-combine-recommend/load-generation-input.js";
import {
  loadExperienceIndex,
  runCombineRecommend,
} from "../lib/ai-combine-recommend/index.js";
import { normalizeCombineExperiencesPerCompanyMax } from "../lib/combine-experiences-per-company.js";
import {
  buildCompanyTierContext,
  normalizeExperienceJdTierDecayPercent,
  normalizeExperienceDimensionMode,
} from "../lib/resume-generation-policy.js";
import { withTokenUsed } from "../lib/ai-token-used-response.js";
import { prisma } from "../lib/prisma.js";
import { getUserAiSettings } from "../lib/user-ai-settings.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const postSchema = z.object({
  generationId: z.string().trim().min(1),
  companyId: z.string().trim().min(1).optional(),
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
    return c.json({ error: "Generation ID is required." }, 400);
  }

  const generation = await prisma.generation.findFirst({
    where: { id: parsed.data.generationId, userId: user.id },
    select: {
      id: true,
      doVerdict: true,
      jobJson: true,
      combineJson: true,
      verdictMarkdown: true,
    },
  });
  if (!generation) {
    return c.json({ error: "Generation was not found." }, 404);
  }

  const loaded = loadCombineRecommendInputFromGeneration(generation);
  if (!loaded.success) {
    return c.json({ error: loaded.error }, 400);
  }

  const aiSettings = await getUserAiSettings(user.id);
  if (!aiSettings) {
    return c.json(
      {
        error:
          "AI Agent is not configured. Save a provider and API key in Settings first.",
      },
      400,
    );
  }

  const provider = aiSettings.provider;

  const [profile, generationProcess] = await Promise.all([
    prisma.profile.findFirst({
      where: { id: loaded.input.profileId, userId: user.id },
    }),
    prisma.generationProcess.findUnique({ where: { userId: user.id } }),
  ]);
  if (!profile) {
    return c.json({ error: "Selected profile was not found." }, 400);
  }

  const scopedCompanies = parsed.data.companyId
    ? loaded.input.companies.filter(
        (item) => item.companyId === parsed.data.companyId,
      )
    : loaded.input.companies;
  if (scopedCompanies.length < 1) {
    return c.json(
      {
        error: parsed.data.companyId
          ? "Selected company is not included in Combine."
          : "Include at least one company in Combine first.",
      },
      400,
    );
  }

  const companyIds = scopedCompanies.map((item) => item.companyId);
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

  const combineExperiencesPerCompanyMax = normalizeCombineExperiencesPerCompanyMax(
    generationProcess?.combineExperiencesPerCompanyMax,
  );
  const experienceDimensionMode = normalizeExperienceDimensionMode(
    generationProcess?.experienceDimensionMode,
  );
  const experienceJdTierDecayPercent = normalizeExperienceJdTierDecayPercent(
    generationProcess?.experienceJdTierDecayPercent,
  );
  const companyTierById = new Map(
    loaded.input.companies.map((entry, index) => [
      entry.companyId,
      buildCompanyTierContext(index, experienceJdTierDecayPercent),
    ]),
  );

  try {
    const runInput = {
      apiKey: aiSettings.apiKey,
      jobDescription: loaded.input.jobDescription,
      acceptedMarkdown: loaded.input.acceptedMarkdown,
      profileId: loaded.input.profileId,
      companies: scopedCompanies.map((entry) => {
        const company = companyById.get(entry.companyId);
        if (!company) {
          throw new Error("Company was not found.");
        }
        const tier = companyTierById.get(entry.companyId);
        if (!tier) {
          throw new Error("Company tier context was not found.");
        }
        return {
          companyId: entry.companyId,
          name: company.name,
          whatCompanyIs: company.whatCompanyIs,
          startDate: entry.startDate,
          endDate: entry.endDate,
          roleContext: entry.roleContext,
          keywordContext: entry.keywordContext,
          resumeOrderIndex: tier.resumeOrderIndex,
          jdTierPercent: tier.jdTierPercent,
        };
      }),
      experienceIndex,
    };

    const result = await runCombineRecommend(
      runInput,
      combineExperiencesPerCompanyMax,
      experienceDimensionMode,
      experienceJdTierDecayPercent,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "combineRecommend",
      generationId: generation.id,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(withTokenUsed(result.result, tokenUsed));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Combine recommendation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
