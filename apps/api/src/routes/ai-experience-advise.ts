import { Hono } from "hono";
import { z } from "zod";
import {
  applyExperienceAdviseOperations,
  buildExperienceAdviseFingerprint,
  loadExperienceAdviseGraph,
  runExperienceAdvise,
} from "../lib/ai-experience-advise/index.js";
import { isAiProviderId, type AiProviderId } from "../lib/ai-provider.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

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

  try {
    const graph = await loadExperienceAdviseGraph(
      user.id,
      parsed.data.targetExperienceId,
    );
    const workspaceFingerprint = await buildExperienceAdviseFingerprint(
      user.id,
    );

    const result = await runExperienceAdvise(provider, {
      apiKey: setting.apiKey,
      graph,
      userFacts: parsed.data.userFacts,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "experienceAdvise",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      result: result.result,
      workspaceFingerprint,
      usage: result.usage,
      tokenUsed,
    });
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
