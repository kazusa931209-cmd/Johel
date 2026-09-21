import { Hono } from "hono";
import { z } from "zod";
import { runAiJdMetaExtract } from "../lib/ai-jd-meta/index";
import { prisma } from "../lib/prisma";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { recordAiUsage } from "../lib/record-ai-usage";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import { requireUser } from "../lib/session";

const JOB_TEXT_MAX = 10_000;

const postSchema = z.object({
  jobDescription: z.string().trim().min(1).max(JOB_TEXT_MAX),
  generationId: z.string().trim().min(1).optional(),
});

export const aiJdMetaRoutes = new Hono();

aiJdMetaRoutes.post("/", async (c) => {
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
    const result = await runAiJdMetaExtract(provider, {
      jobDescription: parsed.data.jobDescription,
      apiKey: aiSettings.apiKey,
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    await recordAiUsage({
      userId: user.id,
      aiProvider: provider,
      generateType: "jdMeta",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(
      withTokenUsed(
        {
          jdCompanyName: result.jdCompanyName,
          jdJobRole: result.jdJobRole,
        },
        tokenUsed,
      ),
    );
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "JD metadata extraction failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
