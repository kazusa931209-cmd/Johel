import { Hono } from "hono";
import { z } from "zod";
import { isAiProviderId } from "../lib/ai-provider.js";
import { runAiVerdict, type AiProviderId } from "../lib/ai-verdict/index.js";
import { prisma } from "../lib/prisma.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX),
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

  const verdict = await prisma.verdict.findUnique({
    where: { userId: user.id },
  });
  const verdictPrompt = verdict?.verdictPrompt?.trim() ?? "";
  if (!verdictPrompt) {
    return c.json(
      {
        error:
          "Verdict Prompt is not configured. Save your Verdict Prompt on the Verdict page first.",
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
    const result = await runAiVerdict(provider, {
      jobDescription: parsed.data.jobDescription,
      verdictPrompt,
      apiKey: setting.apiKey,
    });

    await prisma.aiUsage.create({
      data: {
        userId: user.id,
        aiProvider: provider,
        inputToken: result.usage.inputToken,
        outputToken: result.usage.outputToken,
        input: result.usage.input,
        output: result.usage.output,
      },
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      markdown: result.markdown,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Verdict failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
