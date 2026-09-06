import { Hono } from "hono";
import { z } from "zod";
import { isAiProviderId } from "../lib/ai-provider.js";
import {
  runAiPromptHelper,
  type PromptHelperKind,
} from "../lib/ai-prompt-helper/index.js";
import type { AiProviderId } from "../lib/ai-verdict/index.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const PROMPT_MAX = 20_000;
const REQUEST_MAX = 150;

const postSchema = z.object({
  kind: z.enum([
    "verdict",
    "generate",
    "evaluate",
    "companyDescription",
    "experienceDescription",
  ]),
  request: z.string().trim().min(1).max(REQUEST_MAX),
  currentPrompt: z.string().max(PROMPT_MAX),
});

export const aiPromptHelperRoutes = new Hono();

aiPromptHelperRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: `Request is required (max ${REQUEST_MAX} characters).`,
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
    const result = await runAiPromptHelper(provider, {
      kind: parsed.data.kind as PromptHelperKind,
      currentPrompt: parsed.data.currentPrompt,
      request: parsed.data.request,
      apiKey: setting.apiKey,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "promptHelper",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      sentence: result.sentence,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Prompt helper failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
