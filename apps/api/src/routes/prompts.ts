import { Hono } from "hono";
import { z } from "zod";
import { formatMarkdownOnSave } from "../lib/ai-markdown-format/format-on-save.js";
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

  const existing = await prisma.prompt.findUnique({
    where: { userId: user.id },
  });

  try {
    const [verdictPrompt, generatePrompt, evaluatePrompt] = await Promise.all([
      formatMarkdownOnSave({
        userId: user.id,
        kind: "verdict",
        submitted: parsed.data.verdictPrompt,
        stored: existing?.verdictPrompt,
        maxLen: PROMPT_MAX,
      }),
      formatMarkdownOnSave({
        userId: user.id,
        kind: "generate",
        submitted: parsed.data.generatePrompt,
        stored: existing?.generatePrompt,
        maxLen: PROMPT_MAX,
      }),
      formatMarkdownOnSave({
        userId: user.id,
        kind: "evaluate",
        submitted: parsed.data.evaluatePrompt,
        stored: existing?.evaluatePrompt,
        maxLen: PROMPT_MAX,
      }),
    ]);

    const prompts = await prisma.prompt.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        verdictPrompt: verdictPrompt.formatted,
        generatePrompt: generatePrompt.formatted,
        evaluatePrompt: evaluatePrompt.formatted,
      },
      update: {
        verdictPrompt: verdictPrompt.formatted,
        generatePrompt: generatePrompt.formatted,
        evaluatePrompt: evaluatePrompt.formatted,
      },
    });

    return c.json({
      verdictPrompt: prompts.verdictPrompt,
      generatePrompt: prompts.generatePrompt,
      evaluatePrompt: prompts.evaluatePrompt,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Markdown conversion failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
