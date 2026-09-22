import { Hono } from "hono";
import { z } from "zod";
import {
  applyExperienceSplitOperations,
  buildPoolIndexFromRows,
  runExperienceSplit,
} from "../lib/ai-experience-split/index";
import { buildExperienceAdviseFingerprint } from "../lib/ai-experience-advise/fingerprint";
import { liveExperienceWhere } from "../lib/experience-live";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { prisma } from "../lib/prisma";
import { recordAiUsage } from "../lib/record-ai-usage";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import { requireUser } from "../lib/session";

const suggestSchema = z.object({
  experienceId: z.string().trim().min(1),
});

const draftSchema = z.object({
  category: z.string().nullable(),
  problem: z.string().nullable(),
  actions: z.string().nullable(),
  outcome: z.string().nullable(),
});

const applyOperationSchema = z.object({
  placement: z.literal("create_experience"),
  draft: draftSchema,
});

const applySchema = z.object({
  experienceId: z.string().trim().min(1),
  workspaceFingerprint: z.string().trim().min(1),
  operations: z.array(applyOperationSchema).min(1),
});

export const aiExperienceSplitRoutes = new Hono();

aiExperienceSplitRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = suggestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Experience id is required." }, 400);
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

  try {
    const [target, poolRows, workspaceFingerprint] = await Promise.all([
      prisma.experience.findFirst({
        where: {
          id: parsed.data.experienceId,
          ...liveExperienceWhere(user.id),
        },
      }),
      prisma.experience.findMany({
        where: liveExperienceWhere(user.id),
        orderBy: { category: "asc" },
        select: { id: true, category: true, problem: true },
      }),
      buildExperienceAdviseFingerprint(user.id),
    ]);

    if (!target) {
      return c.json({ error: "Experience was not found." }, 404);
    }

    const result = await runExperienceSplit({
      apiKey: aiSettings.apiKey,
      target: {
        id: target.id,
        category: target.category,
        problem: target.problem,
        actions: target.actions,
        outcome: target.outcome,
      },
      poolIndex: buildPoolIndexFromRows(poolRows, target.id),
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: aiSettings.provider,
      generateType: "experienceSplit",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(
      withTokenUsed(
        {
          result: result.result,
          workspaceFingerprint,
        },
        tokenUsed,
      ),
    );
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Experience split failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});

aiExperienceSplitRoutes.post("/apply", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid Experience split apply payload." }, 400);
  }

  try {
    const result = await applyExperienceSplitOperations({
      userId: user.id,
      experienceId: parsed.data.experienceId,
      workspaceFingerprint: parsed.data.workspaceFingerprint,
      operations: parsed.data.operations,
    });

    return c.json({
      ok: true,
      experienceIds: result.experienceIds,
      archivedId: result.archivedId,
      warnings: result.warnings,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Experience split apply failed. Please try again.";

    if (message.includes("Workspace changed")) {
      return c.json({ error: message }, 409);
    }

    return c.json({ error: message }, 400);
  }
});
