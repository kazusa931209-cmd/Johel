import { generatedResumeSchema } from "@johel/resume";
import { Hono } from "hono";
import { z } from "zod";
import { isGeneralResumePublicId } from "../lib/generation-public-id";
import { runGeneralAiEvaluate } from "../lib/ai-general-evaluate/index";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { prisma } from "../lib/prisma";
import { recordAiUsage } from "../lib/record-ai-usage";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import { requireUser } from "../lib/session";

const USER_PROMPT_MAX = 10_000;

const postSchema = z.object({
  resume: generatedResumeSchema,
  generationId: z.string().trim().min(1),
  userPrompt: z.string().max(USER_PROMPT_MAX).optional().default(""),
  uiLocale: z.enum(["en", "ko"]).optional().default("en"),
});

export const aiGeneralEvaluateRoutes = new Hono();

aiGeneralEvaluateRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "A valid generated resume and generation ID are required.",
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
    },
  });
  if (!generation || !isGeneralResumePublicId(generation.publicId)) {
    return c.json({ error: "Generation was not found." }, 404);
  }

  const userPrompt = parsed.data.userPrompt ?? "";
  if (!userPrompt.trim()) {
    return c.json(
      { error: "A non-empty user prompt is required for this evaluation." },
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

  try {
    const result = await runGeneralAiEvaluate(provider, {
      apiKey: aiSettings.apiKey,
      userPrompt,
      uiLocale: parsed.data.uiLocale,
      resume: parsed.data.resume,
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
        : "AI General Resume evaluation failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
