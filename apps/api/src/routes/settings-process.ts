import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const putSchema = z.object({
  doVerdict: z.boolean(),
  doEvaluate: z.boolean(),
  doWorkflowRecommendation: z.boolean(),
  workflowRecommendationThreshold: z.number().int().min(0).max(100),
});

const lastWorkflowSchema = z.object({
  workflowId: z.string().trim().min(1),
});

export const DEFAULT_GENERATION_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
  doWorkflowRecommendation: false,
  workflowRecommendationThreshold: 70,
} as const;

function toProcessResponse(
  process: {
    doVerdict: boolean;
    doEvaluate: boolean;
    doWorkflowRecommendation: boolean;
    workflowRecommendationThreshold: number;
    lastSelectedWorkflowId: string | null;
  } | null,
) {
  return {
    doVerdict: process?.doVerdict ?? DEFAULT_GENERATION_PROCESS.doVerdict,
    doEvaluate: process?.doEvaluate ?? DEFAULT_GENERATION_PROCESS.doEvaluate,
    doWorkflowRecommendation:
      process?.doWorkflowRecommendation ??
      DEFAULT_GENERATION_PROCESS.doWorkflowRecommendation,
    workflowRecommendationThreshold:
      process?.workflowRecommendationThreshold ??
      DEFAULT_GENERATION_PROCESS.workflowRecommendationThreshold,
    lastSelectedWorkflowId: process?.lastSelectedWorkflowId ?? null,
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
      doWorkflowRecommendation: parsed.data.doWorkflowRecommendation,
      workflowRecommendationThreshold:
        parsed.data.workflowRecommendationThreshold,
    },
    update: {
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
      doWorkflowRecommendation: parsed.data.doWorkflowRecommendation,
      workflowRecommendationThreshold:
        parsed.data.workflowRecommendationThreshold,
    },
  });

  return c.json(toProcessResponse(process));
});

settingsProcessRoutes.put("/last-workflow", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = lastWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid workflow selection." }, 400);
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: parsed.data.workflowId, userId: user.id },
    select: { id: true },
  });
  if (!workflow) {
    return c.json({ error: "Selected workflow was not found." }, 404);
  }

  const process = await prisma.generationProcess.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      lastSelectedWorkflowId: workflow.id,
    },
    update: {
      lastSelectedWorkflowId: workflow.id,
    },
  });

  return c.json(toProcessResponse(process));
});
