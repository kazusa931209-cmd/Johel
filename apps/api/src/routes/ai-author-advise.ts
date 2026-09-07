import { Hono } from "hono";
import { z } from "zod";
import {
  applyAuthorAdviseProposal,
  buildAuthorAdviseWorkspaceFingerprint,
  loadAuthorAdviseGraph,
  runAuthorAdvise,
} from "../lib/ai-author-advise/index.js";
import type { AuthorAdviseProposal } from "../lib/ai-author-advise/types.js";
import { isAiProviderId, type AiProviderId } from "../lib/ai-provider.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const FACTS_MAX = 10_000;

const adviseSchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  userFacts: z.string().trim().min(1).max(FACTS_MAX),
});

const draftSchema = z
  .object({
    category: z.string().nullable().optional(),
    problem: z.string().nullable().optional(),
    actions: z.string().nullable().optional(),
    outcome: z.string().nullable().optional(),
    whatCompanyIs: z.string().nullable().optional(),
    domainAndStack: z.string().nullable().optional(),
    roleContext: z.string().nullable().optional(),
    workflowDescription: z.string().nullable().optional(),
  })
  .optional();

const proposalSchema = z.object({
  placement: z.enum([
    "create_experience",
    "update_experience",
    "link_existing",
    "update_company",
    "update_role_context",
    "update_workflow_description",
    "need_more_facts",
  ]),
  rationale: z.string().trim().min(1),
  questions: z.array(z.string()),
  target: z.object({
    workflowId: z.string().nullable(),
    experienceId: z.string().nullable(),
    companyId: z.string().nullable(),
  }),
  draft: z.object({
    category: z.string().nullable(),
    problem: z.string().nullable(),
    actions: z.string().nullable(),
    outcome: z.string().nullable(),
    whatCompanyIs: z.string().nullable(),
    domainAndStack: z.string().nullable(),
    roleContext: z.string().nullable(),
    workflowDescription: z.string().nullable(),
  }),
  link: z.object({
    workflowId: z.string().nullable(),
    companyId: z.string().nullable(),
    experienceId: z.string().nullable(),
  }),
  warnings: z.array(z.string()),
});

const applySchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  workspaceFingerprint: z.string().trim().min(1),
  proposal: proposalSchema,
  draft: draftSchema,
});

export const aiAuthorAdviseRoutes = new Hono();

aiAuthorAdviseRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = adviseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error:
          "What you need is required (max 10,000 characters).",
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
    const graph = await loadAuthorAdviseGraph(
      user.id,
      parsed.data.workflowId,
    );
    const workspaceFingerprint = await buildAuthorAdviseWorkspaceFingerprint(
      user.id,
      parsed.data.workflowId,
    );

    const result = await runAuthorAdvise(provider, {
      apiKey: setting.apiKey,
      graph,
      userFacts: parsed.data.userFacts,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "authorAdvise",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      proposal: result.proposal,
      workspaceFingerprint,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Quick PCE advisor failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});

aiAuthorAdviseRoutes.post("/apply", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid Quick PCE apply payload." }, 400);
  }

  try {
    const result = await applyAuthorAdviseProposal({
      userId: user.id,
      drawerWorkflowId: parsed.data.workflowId,
      workspaceFingerprint: parsed.data.workspaceFingerprint,
      proposal: parsed.data.proposal as AuthorAdviseProposal,
      draftOverride: parsed.data.draft,
    });

    return c.json({
      ok: true,
      appliedWorkflowId: result.appliedWorkflowId,
      warnings: result.warnings,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Quick PCE apply failed. Please try again.";

    if (message.includes("Workspace changed")) {
      return c.json({ error: message }, 409);
    }

    return c.json({ error: message }, 400);
  }
});
