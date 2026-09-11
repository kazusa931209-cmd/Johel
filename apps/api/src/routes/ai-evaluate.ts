import { generatedResumeSchema } from "@johel/resume";
import { Hono } from "hono";
import { z } from "zod";
import { runAiEvaluate } from "../lib/ai-evaluate/index.js";
import { getUserAiSettings } from "../lib/user-ai-settings.js";
import { compileInstruction } from "../lib/prompt-optimize/index.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id.js";
import { withTokenUsed } from "../lib/ai-token-used-response.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobContext: z.string().trim().min(1).max(JOB_TEXT_MAX).optional(),
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX).optional(),
  resume: generatedResumeSchema,
  generationId: z.string().trim().min(1).optional(),
});

export const aiEvaluateRoutes = new Hono();

aiEvaluateRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error:
          "Job context and a valid generated resume are required (max 10,000 characters for the job context).",
      },
      400,
    );
  }

  const jobContext =
    parsed.data.jobContext?.trim() || parsed.data.jobDescription?.trim() || "";
  if (!jobContext) {
    return c.json(
      {
        error:
          "Job context and a valid generated resume are required (max 10,000 characters for the job context).",
      },
      400,
    );
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

  const prompts = await prisma.prompt.findUnique({
    where: { userId: user.id },
  });
  const evaluatePrompt = prompts?.evaluatePrompt?.trim() ?? "";
  if (!evaluatePrompt) {
    return c.json(
      {
        error:
          "Evaluate Prompt is not configured. Save your prompts on the Prompts page first.",
      },
      400,
    );
  }

  const provider = aiSettings.provider;

  try {
    const compiledEvaluatePrompt = compileInstruction(
      "evaluate",
      evaluatePrompt,
      prompts?.evaluateExtension ?? "",
    );

    const result = await runAiEvaluate(provider, {
      jobContext,
      resume: parsed.data.resume,
      evaluatePrompt: compiledEvaluatePrompt,
      apiKey: aiSettings.apiKey,
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "evaluate",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(withTokenUsed({ markdown: result.markdown }, tokenUsed));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Evaluate failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
