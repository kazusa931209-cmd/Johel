import { DEFAULT_REFINE_PROMPT } from "@johel/prompt-defaults";
import { Hono } from "hono";
import { z } from "zod";
import { runAiDraftRefine } from "../lib/ai-draft-refine/index";
import {
  loadDraftRefineCompanyScene,
  loadDraftRefineExperiences,
} from "../lib/ai-draft-refine/load-materials";
import { getUserAiSettings } from "../lib/user-ai-settings";
import { compileInstruction } from "../lib/prompt-optimize/index";
import {
  findDraftRefinePromptRow,
  resolveDraftRefineBasePrompt,
  resolveDraftRefineExtension,
} from "../lib/user-prompts";
import { recordAiUsage } from "../lib/record-ai-usage";
import { resolveOwnedGenerationId } from "../lib/resolve-generation-id";
import { withTokenUsed } from "../lib/ai-token-used-response";
import { sumTokenUsed } from "../lib/sum-token-used";
import {
  loadOwnedGenerationResume,
  persistOwnedGenerationResume,
} from "../lib/persist-generation-resume";
import { requireUser } from "../lib/session";

const INSTRUCTION_MAX = 10_000;

const resumeLanguageSchema = z.enum(["en", "ja", "zh-TW", "zh-CN", "ko"]);

const postSchema = z
  .object({
    builderKind: z.enum(["jd", "general"]),
    generationId: z.string().trim().min(1),
    language: resumeLanguageSchema,
    mode: z.enum(["instruction", "experiences"]),
    instruction: z.string().max(INSTRUCTION_MAX).optional(),
    experienceIds: z.array(z.string().trim().min(1)).optional(),
    companyId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "instruction") {
      if (!value.instruction?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Instruction is required for instruction mode.",
          path: ["instruction"],
        });
      }
    }
    if (value.mode === "experiences") {
      const hasExperiences =
        value.experienceIds && value.experienceIds.length > 0;
      const hasCompany = Boolean(value.companyId?.trim());
      if (!hasExperiences && !hasCompany) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one experience or a company.",
          path: ["experienceIds"],
        });
      }
    }
  });

export const aiDraftRefineRoutes = new Hono();

aiDraftRefineRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Draft refine input is invalid.",
      },
      400,
    );
  }

  const loaded = await loadOwnedGenerationResume(
    user.id,
    parsed.data.generationId,
    parsed.data.builderKind,
  );
  if (!loaded.ok) {
    return c.json({ error: loaded.error }, loaded.status);
  }

  const prompts = await findDraftRefinePromptRow(user.id);

  const builderKind = parsed.data.builderKind;
  const useRefinePrompt = builderKind === "general";
  const basePrompt = resolveDraftRefineBasePrompt(
    prompts,
    builderKind,
    DEFAULT_REFINE_PROMPT,
  );
  const extension = resolveDraftRefineExtension(prompts, builderKind);

  if (!basePrompt) {
    return c.json(
      {
        error: useRefinePrompt
          ? "Refine Prompt is not configured. Save your prompts on the Prompts page first."
          : "Generate Prompt is not configured. Save your prompts on the Prompts page first.",
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

  let experiences;
  if (
    parsed.data.mode === "experiences" &&
    parsed.data.experienceIds &&
    parsed.data.experienceIds.length > 0
  ) {
    experiences = await loadDraftRefineExperiences(
      user.id,
      parsed.data.experienceIds,
    );
    if (experiences.length !== parsed.data.experienceIds.length) {
      return c.json(
        { error: "One or more selected experiences were not found." },
        400,
      );
    }
  }

  let company = null;
  if (parsed.data.companyId) {
    company = await loadDraftRefineCompanyScene(
      user.id,
      parsed.data.companyId,
    );
    if (!company) {
      return c.json({ error: "Selected company was not found." }, 400);
    }
  }

  const compiledPrompt = compileInstruction(
    useRefinePrompt ? "refine" : "generate",
    basePrompt,
    extension,
  );

  try {
    const result = await runAiDraftRefine(aiSettings.provider, {
      apiKey: aiSettings.apiKey,
      systemPrompt: compiledPrompt,
      input: {
        language: parsed.data.language,
        resume: loaded.resume,
        mode: parsed.data.mode,
        instruction: parsed.data.instruction?.trim() || undefined,
        experiences,
        company: company ?? undefined,
      },
    });

    const generationId = await resolveOwnedGenerationId(
      user.id,
      parsed.data.generationId,
    );

    const persisted = await persistOwnedGenerationResume(
      user.id,
      parsed.data.generationId,
      parsed.data.builderKind,
      result.resume,
    );
    if (!persisted.ok) {
      return c.json({ error: persisted.error }, persisted.status);
    }

    await recordAiUsage({
      userId: user.id,
      aiProvider: aiSettings.provider,
      generateType: "draftRefine",
      generationId,
      usage: result.usage,
    });

    const tokenUsed = await sumTokenUsed(user.id);

    return c.json(withTokenUsed({ resume: result.resume }, tokenUsed));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Draft resume refine failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});
