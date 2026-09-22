import { Hono } from "hono";
import { z } from "zod";
import {
  applyExperienceAdviseOperations,
  runExperienceAdvise,
} from "../lib/ai-experience-advise/index";
import { loadExperienceAdviseContext } from "../lib/ai-experience-advise/load-context";
import type { ExperienceAdviseExperienceSnapshot } from "../lib/ai-experience-advise/types";
import {
  ensureExperienceEmbeddings,
  normalizeExperienceAdvisePoolDepth,
  rankByCosine,
  selectExpandedExperienceIdsWithEmbedding,
  selectIndexExperienceIdsForAdvise,
} from "../lib/experience-embedding/index";
import { createOpenAiEmbedding } from "../lib/openai/embeddings";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { prisma } from "../lib/prisma";
import { recordAiUsage } from "../lib/record-ai-usage";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import { requireUser } from "../lib/session";

const FACTS_MAX = 10_000;

const adviseSchema = z.object({
  targetExperienceId: z.string().trim().min(1).optional(),
  userFacts: z.string().trim().min(1).max(FACTS_MAX),
});

const draftSchema = z.object({
  category: z.string().nullable(),
  problem: z.string().nullable(),
  actions: z.string().nullable(),
  outcome: z.string().nullable(),
});

const applyOperationSchema = z.object({
  placement: z.enum(["create_experience", "update_experience"]),
  targetExperienceId: z.string().nullable(),
  draft: draftSchema,
});

const applySchema = z.object({
  workspaceFingerprint: z.string().trim().min(1),
  operations: z.array(applyOperationSchema).min(1),
});

export const aiExperienceAdviseRoutes = new Hono();

function buildExperiencesById(
  experiences: Array<{
    id: string;
    category: string;
    problem: string;
    actions: string;
    outcome: string;
  }>,
): Record<string, ExperienceAdviseExperienceSnapshot> {
  return Object.fromEntries(
    experiences.map((experience) => [
      experience.id,
      {
        category: experience.category,
        problem: experience.problem,
        actions: experience.actions,
        outcome: experience.outcome,
      },
    ]),
  );
}

aiExperienceAdviseRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = adviseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "What you did is required (max 10,000 characters).",
      },
      400,
    );
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

  try {
    const [{ graph, workspaceFingerprint }, generationProcess] =
      await Promise.all([
        loadExperienceAdviseContext(user.id, parsed.data.targetExperienceId),
        prisma.generationProcess.findUnique({ where: { userId: user.id } }),
      ]);

    const poolDepth = normalizeExperienceAdvisePoolDepth(
      generationProcess?.experienceAdvisePoolDepth,
    );

    const embeddingCandidates = await ensureExperienceEmbeddings({
      userId: user.id,
      apiKey: aiSettings.apiKey,
      experiences: graph.experiences,
    });

    const queryEmbedding = await createOpenAiEmbedding(
      aiSettings.apiKey,
      parsed.data.userFacts,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "embedding",
      usage: {
        inputToken: queryEmbedding.inputToken,
        outputToken: 0,
        input: parsed.data.userFacts,
        output: "",
      },
    });

    const embeddingRank = rankByCosine(
      queryEmbedding.vector,
      embeddingCandidates,
    );

    const expandedIds = selectExpandedExperienceIdsWithEmbedding({
      experiences: graph.experiences,
      targetExperienceId: graph.targetExperienceId,
      poolDepth,
      queryVector: queryEmbedding.vector,
      embeddingCandidates,
    });

    const { indexIds } = selectIndexExperienceIdsForAdvise({
      experiences: graph.experiences,
      expandedIds,
      poolDepth,
      embeddingRankedIds: embeddingRank.map((item) => item.id),
    });

    const result = await runExperienceAdvise(provider, {
      apiKey: aiSettings.apiKey,
      graph,
      userFacts: parsed.data.userFacts,
      expandedIds,
      indexIds,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "experienceAdvise",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(
      withTokenUsed(
        {
          result: result.result,
          workspaceFingerprint,
          experiencesById: buildExperiencesById(graph.experiences),
        },
        tokenUsed,
      ),
    );
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Experience advisor failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});

aiExperienceAdviseRoutes.post("/apply", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid Experience advisor apply payload." }, 400);
  }

  try {
    const result = await applyExperienceAdviseOperations({
      userId: user.id,
      workspaceFingerprint: parsed.data.workspaceFingerprint,
      operations: parsed.data.operations,
    });

    return c.json({
      ok: true,
      experienceIds: result.experienceIds,
      warnings: result.warnings,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Experience advisor apply failed. Please try again.";

    if (message.includes("Workspace changed")) {
      return c.json({ error: message }, 409);
    }

    return c.json({ error: message }, 400);
  }
});
