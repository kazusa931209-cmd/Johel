import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const putSchema = z.object({
  usePromptOptimizationAi: z.boolean(),
});

export const DEFAULT_PROMPT_OPTIMIZATION = {
  usePromptOptimizationAi: true,
} as const;

export const settingsPromptOptimizationRoutes = new Hono();

settingsPromptOptimizationRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const process = await prisma.generationProcess.findUnique({
    where: { userId: user.id },
  });

  return c.json({
    usePromptOptimizationAi:
      process?.usePromptOptimizationAi ??
      DEFAULT_PROMPT_OPTIMIZATION.usePromptOptimizationAi,
  });
});

settingsPromptOptimizationRoutes.put("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid prompt optimization settings." }, 400);
  }

  const existing = await prisma.generationProcess.findUnique({
    where: { userId: user.id },
  });

  const process = await prisma.generationProcess.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      usePromptOptimizationAi: parsed.data.usePromptOptimizationAi,
    },
    update: {
      usePromptOptimizationAi: parsed.data.usePromptOptimizationAi,
    },
  });

  return c.json({
    usePromptOptimizationAi: process.usePromptOptimizationAi,
    changed:
      existing != null &&
      existing.usePromptOptimizationAi !== process.usePromptOptimizationAi,
  });
});
