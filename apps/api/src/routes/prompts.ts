import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const PROMPT_MAX = 10_000;

const putSchema = z.object({
  verdictPrompt: z.string().trim().min(1).max(PROMPT_MAX),
  generatePrompt: z.string().trim().min(1).max(PROMPT_MAX),
  evaluatePrompt: z.string().trim().min(1).max(PROMPT_MAX),
});

export const promptsRoutes = new Hono();

promptsRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const prompts = await prisma.prompt.findUnique({
    where: { userId: user.id },
  });

  return c.json({
    verdictPrompt: prompts?.verdictPrompt ?? "",
    generatePrompt: prompts?.generatePrompt ?? "",
    evaluatePrompt: prompts?.evaluatePrompt ?? "",
  });
});

promptsRoutes.put("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: `All prompts are required (max ${PROMPT_MAX} characters each).`,
      },
      400,
    );
  }

  const prompts = await prisma.prompt.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      verdictPrompt: parsed.data.verdictPrompt,
      generatePrompt: parsed.data.generatePrompt,
      evaluatePrompt: parsed.data.evaluatePrompt,
    },
    update: {
      verdictPrompt: parsed.data.verdictPrompt,
      generatePrompt: parsed.data.generatePrompt,
      evaluatePrompt: parsed.data.evaluatePrompt,
    },
  });

  return c.json({
    verdictPrompt: prompts.verdictPrompt,
    generatePrompt: prompts.generatePrompt,
    evaluatePrompt: prompts.evaluatePrompt,
  });
});
