import { Hono } from "hono";
import { z } from "zod";
import { runAiResume } from "../lib/ai-resume/index.js";
import { getUserAiSettings } from "../lib/user-ai-settings.js";
import { assembleFromCombineSnapshot } from "../lib/resume/assemble-input.js";
import { compileInstruction } from "../lib/prompt-optimize/index.js";
import { prisma } from "../lib/prisma.js";
import { recordAiUsage } from "../lib/record-ai-usage.js";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id.js";
import { withTokenUsed } from "../lib/ai-token-used-response.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import { requireUser } from "../lib/session.js";

const JOB_TEXT_MAX = 10_000;

const combineCompanySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  experienceIds: z.array(z.string().trim().min(1)).default([]),
});

const combineSchema = z.object({
  profileId: z.string().trim().min(1),
  language: z.enum(["en", "ja", "zh-TW", "zh-CN", "ko"]),
  emphasis: z.string().max(2000),
  companies: z.array(combineCompanySchema).min(1),
});

const postSchema = z.object({
  jobContext: z.string().trim().min(1).max(JOB_TEXT_MAX),
  combine: combineSchema,
  generationId: z.string().trim().min(1).optional(),
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
          "Resume generation input is invalid. Check job context and combine selection.",
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

  const provider = aiSettings.provider;

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
    generationInput = await assembleFromCombineSnapshot({
      userId: user.id,
      jobContext: parsed.data.jobContext,
      combine: parsed.data.combine,
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
      apiKey: aiSettings.apiKey,
      generatePrompt: compiledGeneratePrompt,
      input: generationInput,
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "generate",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(withTokenUsed({ resume: result.resume }, tokenUsed));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "AI Resume generation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
