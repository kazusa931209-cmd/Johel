import { Hono } from "hono";
import { z } from "zod";
import {
  extractLinkedExperienceIds,
  runAiCheckGaps,
} from "../lib/ai-check-gaps/index.js";
import { loadExperienceAdviseContext } from "../lib/ai-experience-advise/load-context.js";
import {
  ensureExperienceEmbeddings,
  normalizeExperienceAdvisePoolDepth,
  rankByCosine,
  selectExpandedExperienceIdsWithEmbedding,
  selectIndexExperienceIdsForAdvise,
} from "../lib/experience-embedding/index.js";
import { createOpenAiEmbedding } from "../lib/openai/embeddings.js";
import { getUserAiSettings } from "../lib/user-ai-settings.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id.js";
import { withTokenUsed } from "../lib/ai-token-used-response.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const GAP_QUERY_MAX = 2_000;

const postSchema = z.object({
  gapQuery: z.string().trim().min(1).max(GAP_QUERY_MAX),
  generationId: z.string().trim().min(1).optional(),
});

export const aiCheckGapsRoutes = new Hono();

aiCheckGapsRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Gap description is required (max 2,000 characters).",
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
    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    const [{ graph }, generationProcess, generationRow] = await Promise.all([
      loadExperienceAdviseContext(user.id),
      prisma.generationProcess.findUnique({ where: { userId: user.id } }),
      generationId
        ? prisma.generation.findFirst({
            where: { id: generationId, userId: user.id },
            select: { combineJson: true },
          })
        : Promise.resolve(null),
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
      parsed.data.gapQuery,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "embedding",
      generationId,
      usage: {
        inputToken: queryEmbedding.inputToken,
        outputToken: 0,
        input: parsed.data.gapQuery,
        output: "",
      },
    });

    const embeddingRank = rankByCosine(
      queryEmbedding.vector,
      embeddingCandidates,
    );

    const expandedIds = selectExpandedExperienceIdsWithEmbedding({
      experiences: graph.experiences,
      targetExperienceId: null,
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

    const linkedExperienceIds = generationRow
      ? new Set(extractLinkedExperienceIds(generationRow.combineJson))
      : null;

    const result = await runAiCheckGaps(provider, {
      apiKey: aiSettings.apiKey,
      gapQuery: parsed.data.gapQuery,
      graph,
      expandedIds,
      indexIds,
      linkedExperienceIds,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "checkGaps",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(
      withTokenUsed(
        {
          markdown: result.markdown,
          verdict: result.verdict,
          matchedExperienceIds: result.matchedExperienceIds,
        },
        tokenUsed,
      ),
    );
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Gap check failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
