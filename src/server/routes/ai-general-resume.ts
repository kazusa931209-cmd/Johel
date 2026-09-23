import { Hono } from "hono";
import { z } from "zod";
import { isGeneralResumePublicId } from "../lib/generation-public-id";
import { runGeneralAiResume } from "../lib/ai-general-resume/index";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { assembleGeneralResumeGenerationInput } from "../lib/resume/assemble-general-input";
import { compileInstruction } from "../lib/prompt-optimize/index";
import { prisma } from "../lib/prisma";
import { recordAiUsage } from "../lib/record-ai-usage";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import { persistOwnedGenerationResume } from "../lib/persist-generation-resume";
import { requireUser } from "../lib/session";

const combineCompanySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  keywordContext: z.string().max(500).optional(),
  experienceIds: z.array(z.string().trim().min(1)).default([]),
});

const combineSchema = z.object({
  profileId: z.string().trim().min(1),
  language: z.enum(["en", "ja", "zh-TW", "zh-CN", "ko"]),
  emphasis: z.string().max(2000).optional().default(""),
  userInstruction: z.string().max(10_000).optional().default(""),
  platform: z.string().max(500).optional().default(""),
  companies: z.array(combineCompanySchema).min(1),
});

const postSchema = z.object({
  combine: combineSchema,
  generationId: z.string().trim().min(1),
});

export const aiGeneralResumeRoutes = new Hono();

aiGeneralResumeRoutes.post("/", async (c) => {
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
          "General resume generation input is invalid. Check combine selection.",
      },
      400,
    );
  }

  const generation = await prisma.generation.findFirst({
    where: {
      id: parsed.data.generationId,
      userId: user.id,
    },
    select: {
      id: true,
      publicId: true,
      generatePrompt: true,
    },
  });
  if (!generation || !isGeneralResumePublicId(generation.publicId)) {
    return c.json({ error: "Generation was not found." }, 404);
  }

  const generatePrompt = generation.generatePrompt?.trim() ?? "";
  if (!generatePrompt) {
    return c.json(
      {
        error: "Generate prompt is missing for this general resume run.",
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

  let generationInput;
  try {
    generationInput = await assembleGeneralResumeGenerationInput({
      userId: user.id,
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

    const result = await runGeneralAiResume(provider, {
      apiKey: aiSettings.apiKey,
      generatePrompt: compiledGeneratePrompt,
      input: generationInput,
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    if (generationId) {
      const persisted = await persistOwnedGenerationResume(
        user.id,
        generationId,
        "general",
        result.resume,
      );
      if (!persisted.ok) {
        return c.json({ error: persisted.error }, persisted.status);
      }
    }

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
        : "AI General Resume generation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
