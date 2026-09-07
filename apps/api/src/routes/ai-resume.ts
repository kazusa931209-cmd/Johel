import { Hono } from "hono";
import { z } from "zod";
import { isAiProviderId } from "../lib/ai-provider.js";
import { runAiResume, type AiProviderId } from "../lib/ai-resume/index.js";
import { assembleResumeGenerationInput } from "../lib/resume/assemble-input.js";
import { compileInstruction } from "../lib/prompt-optimize/index.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX),
  acceptedMarkdown: z.string().trim().max(JOB_TEXT_MAX),
  workflowId: z.string().trim().min(1),
});

export const aiResumeRoutes = new Hono();

aiResumeRoutes.post("/", async (c) => {
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
          "Resume generation input is invalid. Check job description and workflow selection.",
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

  const prompts = await prisma.prompt.findUnique({
    where: { userId: user.id },
  });
  const generatePrompt = prompts?.generatePrompt?.trim() ?? "";
  if (!generatePrompt) {
    return c.json(
      {
        error:
          "Generate Prompt is not configured. Save your prompts on the Prompts page first.",
      },
      400,
    );
  }

  let generationInput;
  try {
    generationInput = await assembleResumeGenerationInput({
      userId: user.id,
      ...parsed.data,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Resume generation input could not be loaded.";
    return c.json({ error: message }, 400);
  }

  try {
    const compiledGeneratePrompt = compileInstruction(
      "generate",
      generatePrompt,
    );

    const result = await runAiResume(provider, {
      apiKey: setting.apiKey,
      generatePrompt: compiledGeneratePrompt,
      input: generationInput,
    });

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "generate",
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json({
      resume: result.resume,
      usage: result.usage,
      tokenUsed,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Resume generation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
