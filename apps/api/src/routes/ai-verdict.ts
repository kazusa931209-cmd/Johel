import { Hono } from "hono";
import { z } from "zod";
import { isAiProviderId } from "../lib/ai-provider.js";
import { compileInstruction } from "../lib/prompt-optimize/index.js";
import { runAiVerdict, type AiProviderId } from "../lib/ai-verdict/index.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id.js";
import { withTokenUsed } from "../lib/ai-token-used-response.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX),
  generationId: z.string().trim().min(1).optional(),
});

export const aiVerdictRoutes = new Hono();

aiVerdictRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Job Description is required (max 10,000 characters)." },
      400,
    );
  }

  const prompts = await prisma.prompt.findUnique({
    where: { userId: user.id },
  });
  const verdictPrompt = prompts?.verdictPrompt?.trim() ?? "";
  if (!verdictPrompt) {
    return c.json(
      {
        error:
          "Verdict Prompt is not configured. Save your prompts on the Prompts page first.",
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
    const compiledVerdictPrompt = compileInstruction(
      "verdict",
      verdictPrompt,
      prompts?.verdictExtension ?? "",
    );

    const result = await runAiVerdict(provider, {
      jobDescription: parsed.data.jobDescription,
      verdictPrompt: compiledVerdictPrompt,
      apiKey: setting.apiKey,
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "verdict",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(withTokenUsed({ markdown: result.markdown }, tokenUsed));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Verdict failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
