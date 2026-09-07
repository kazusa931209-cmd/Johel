import { Hono } from "hono";
import { z } from "zod";
import {
  formatMarkdownOnSave,
} from "../lib/ai-markdown-format/format-on-save.js";
import type { MarkdownFormatKind } from "../lib/ai-markdown-format/types.js";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const PROMPT_MAX = 10_000;

const promptFieldSchema = z.string().trim().min(1).max(PROMPT_MAX);

const PROMPT_KIND_CONFIG = {
  verdict: {
    bodyKey: "verdictPrompt",
    dbKey: "verdictPrompt",
    formatKind: "verdict",
    label: "Verdict Prompt",
  },
  generate: {
    bodyKey: "generatePrompt",
    dbKey: "generatePrompt",
    formatKind: "generate",
    label: "Generate Prompt",
  },
  evaluate: {
    bodyKey: "evaluatePrompt",
    dbKey: "evaluatePrompt",
    formatKind: "evaluate",
    label: "Evaluate Prompt",
  },
} as const satisfies Record<
  string,
  {
    bodyKey: string;
    dbKey: "verdictPrompt" | "generatePrompt" | "evaluatePrompt";
    formatKind: MarkdownFormatKind;
    label: string;
  }
>;

type PromptKind = keyof typeof PROMPT_KIND_CONFIG;

function serializePrompts(prompts: {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
}) {
  return {
    verdictPrompt: prompts.verdictPrompt,
    generatePrompt: prompts.generatePrompt,
    evaluatePrompt: prompts.evaluatePrompt,
  };
}

async function savePromptKind(
  userId: string,
  kind: PromptKind,
  submitted: string,
) {
  const config = PROMPT_KIND_CONFIG[kind];
  const existing = await prisma.prompt.findUnique({
    where: { userId },
  });

  const formatted = await formatMarkdownOnSave({
    userId,
    kind: config.formatKind,
    submitted,
    stored: existing?.[config.dbKey],
    maxLen: PROMPT_MAX,
  });

  const prompts = await prisma.prompt.upsert({
    where: { userId },
    create: {
      userId,
      verdictPrompt:
        config.dbKey === "verdictPrompt"
          ? formatted.formatted
          : (existing?.verdictPrompt ?? ""),
      generatePrompt:
        config.dbKey === "generatePrompt"
          ? formatted.formatted
          : (existing?.generatePrompt ?? ""),
      evaluatePrompt:
        config.dbKey === "evaluatePrompt"
          ? formatted.formatted
          : (existing?.evaluatePrompt ?? ""),
    },
    update: {
      [config.dbKey]: formatted.formatted,
    },
  });

  return serializePrompts(prompts);
}

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

for (const [kind, config] of Object.entries(PROMPT_KIND_CONFIG) as [
  PromptKind,
  (typeof PROMPT_KIND_CONFIG)[PromptKind],
][]) {
  promptsRoutes.put(`/${kind}`, async (c) => {
    const user = await requireUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = z
      .object({
        [config.bodyKey]: promptFieldSchema,
      })
      .safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: `${config.label} is required (max ${PROMPT_MAX} characters).`,
        },
        400,
      );
    }

    try {
      const submitted = parsed.data[config.bodyKey as keyof typeof parsed.data];
      const prompts = await savePromptKind(user.id, kind, submitted);
      return c.json(prompts);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Markdown conversion failed. Please try again.";
      return c.json({ error: message }, 502);
    }
  });
}
