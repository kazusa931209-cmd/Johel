import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const VERDICT_PROMPT_MAX = 10_000;

const putSchema = z.object({
  verdictPrompt: z.string().trim().min(1).max(VERDICT_PROMPT_MAX),
});

export const verdictRoutes = new Hono();

verdictRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const verdict = await prisma.verdict.findUnique({
    where: { userId: user.id },
  });

  return c.json({ verdictPrompt: verdict?.verdictPrompt ?? "" });
});

verdictRoutes.put("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: `Verdict Prompt is required (max ${VERDICT_PROMPT_MAX} characters).`,
      },
      400,
    );
  }

  const verdict = await prisma.verdict.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      verdictPrompt: parsed.data.verdictPrompt,
    },
    update: {
      verdictPrompt: parsed.data.verdictPrompt,
    },
  });

  return c.json({ verdictPrompt: verdict.verdictPrompt });
});
