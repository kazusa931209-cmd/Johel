import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const putSchema = z.object({
  doVerdict: z.boolean(),
  doEvaluate: z.boolean(),
});

export const DEFAULT_GENERATION_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
} as const;

function toProcessResponse(
  process: {
    doVerdict: boolean;
    doEvaluate: boolean;
  } | null,
) {
  return {
    doVerdict: process?.doVerdict ?? DEFAULT_GENERATION_PROCESS.doVerdict,
    doEvaluate: process?.doEvaluate ?? DEFAULT_GENERATION_PROCESS.doEvaluate,
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
    },
    update: {
      doVerdict: parsed.data.doVerdict,
      doEvaluate: parsed.data.doEvaluate,
    },
  });

  return c.json(toProcessResponse(process));
});
