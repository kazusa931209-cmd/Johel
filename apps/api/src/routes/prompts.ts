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
const extensionFieldSchema = z.string().trim().max(PROMPT_MAX);

const PROMPT_KIND_CONFIG = {
  verdict: {
    bodyKey: "verdictPrompt",
    extensionKey: "verdictExtension",
    dbKey: "verdictPrompt",
    extensionDbKey: "verdictExtension",
    formatKind: "verdict",
    label: "Verdict Prompt",
    extensionLabel: "Verdict extension",
  },
  generate: {
    bodyKey: "generatePrompt",
    extensionKey: "generateExtension",
    dbKey: "generatePrompt",
    extensionDbKey: "generateExtension",
    formatKind: "generate",
    label: "Generate Prompt",
    extensionLabel: "Generate extension",
  },
  evaluate: {
    bodyKey: "evaluatePrompt",
    extensionKey: "evaluateExtension",
    dbKey: "evaluatePrompt",
    extensionDbKey: "evaluateExtension",
    formatKind: "evaluate",
    label: "Evaluate Prompt",
    extensionLabel: "Evaluate extension",
  },
} as const satisfies Record<
  string,
  {
    bodyKey: string;
    extensionKey: string;
    dbKey: "verdictPrompt" | "generatePrompt" | "evaluatePrompt";
    extensionDbKey:
      | "verdictExtension"
      | "generateExtension"
      | "evaluateExtension";
    formatKind: MarkdownFormatKind;
    label: string;
    extensionLabel: string;
  }
>;

type PromptKind = keyof typeof PROMPT_KIND_CONFIG;

function serializePrompts(prompts: {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  verdictExtension: string;
  generateExtension: string;
  evaluateExtension: string;
}) {
  return {
    verdictPrompt: prompts.verdictPrompt,
    generatePrompt: prompts.generatePrompt,
    evaluatePrompt: prompts.evaluatePrompt,
    verdictExtension: prompts.verdictExtension,
    generateExtension: prompts.generateExtension,
    evaluateExtension: prompts.evaluateExtension,
  };
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
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
      verdictExtension: existing?.verdictExtension ?? "",
      generateExtension: existing?.generateExtension ?? "",
      evaluateExtension: existing?.evaluateExtension ?? "",
    },
    update: {
      [config.dbKey]: formatted.formatted,
    },
  });

  return serializePrompts(prompts);
}

async function savePromptExtension(
  userId: string,
  kind: PromptKind,
  submitted: string,
) {
  const config = PROMPT_KIND_CONFIG[kind];
  const existing = await prisma.prompt.findUnique({
    where: { userId },
  });

  const prompts = await prisma.prompt.upsert({
    where: { userId },
    create: {
      userId,
      verdictPrompt: existing?.verdictPrompt ?? "",
      generatePrompt: existing?.generatePrompt ?? "",
      evaluatePrompt: existing?.evaluatePrompt ?? "",
      verdictExtension:
        config.extensionDbKey === "verdictExtension"
          ? submitted
          : (existing?.verdictExtension ?? ""),
      generateExtension:
        config.extensionDbKey === "generateExtension"
          ? submitted
          : (existing?.generateExtension ?? ""),
      evaluateExtension:
        config.extensionDbKey === "evaluateExtension"
          ? submitted
          : (existing?.evaluateExtension ?? ""),
    },
    update: {
      [config.extensionDbKey]: submitted,
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
    verdictExtension: prompts?.verdictExtension ?? "",
    generateExtension: prompts?.generateExtension ?? "",
    evaluateExtension: prompts?.evaluateExtension ?? "",
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
    const admin = isAdminRole(user.role);

    if (admin) {
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
        const submitted =
          parsed.data[config.bodyKey as keyof typeof parsed.data];
        const prompts = await savePromptKind(user.id, kind, submitted);
        return c.json(prompts);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Markdown conversion failed. Please try again.";
        return c.json({ error: message }, 502);
      }
    }

    const parsed = z
      .object({
        [config.extensionKey]: extensionFieldSchema,
      })
      .safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: `${config.extensionLabel} must be at most ${PROMPT_MAX} characters.`,
        },
        400,
      );
    }

    const submitted =
      parsed.data[config.extensionKey as keyof typeof parsed.data];
    const prompts = await savePromptExtension(user.id, kind, submitted);
    return c.json(prompts);
  });
}
