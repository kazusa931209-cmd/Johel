import { Hono } from "hono";
import { z } from "zod";
import {
  pickRecommendedWorkflow,
  runAiWorkflowRecommend,
} from "../lib/ai-workflow-recommend/index.js";
import { isAiProviderId, type AiProviderId } from "../lib/ai-provider.js";
import { loadWorkflowRecommendSummaries } from "../lib/workflow/load-recommend-summaries.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX),
  acceptedMarkdown: z.string().trim().max(JOB_TEXT_MAX).optional(),
});

export const aiWorkflowRecommendRoutes = new Hono();

aiWorkflowRecommendRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Job Description is required (max 10,000 characters)." },
      400,
    );
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

  const process = await prisma.generationProcess.findUnique({
    where: { userId: user.id },
  });
  const threshold = process?.workflowRecommendationThreshold ?? 70;

  const workflows = await loadWorkflowRecommendSummaries(user.id);
  if (workflows.length < 1) {
    return c.json(
      { error: "Add at least one workflow before running recommendation." },
      400,
    );
  }

  const validIds = new Set(workflows.map((item) => item.id));

  try {
    const result = await runAiWorkflowRecommend(provider, {
      apiKey: setting.apiKey,
      jobDescription: parsed.data.jobDescription,
      acceptedMarkdown: parsed.data.acceptedMarkdown,
      workflows,
    });

    const filteredMatches = result.matches.filter((item) =>
      validIds.has(item.workflowId),
    );
    const picked = pickRecommendedWorkflow(filteredMatches, threshold);
    const workflowName =
      picked.workflowId != null
        ? workflows.find((item) => item.id === picked.workflowId)?.name ?? null
        : null;

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "workflowRecommend",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      workflowId: picked.workflowId,
      workflowName,
      score: picked.score,
      threshold,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Workflow recommendation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
