import type { GeneratedResume } from "@johel/resume";
import { parseGeneratedResume } from "@johel/resume";
import {
  GENERATION_KIND_GENERAL,
  GENERATION_KIND_JD,
  type GenerationKind,
} from "./generation-public-id";
import { prisma } from "./prisma";

export type DraftRefineBuilderKind = "jd" | "general";

function kindForBuilder(builderKind: DraftRefineBuilderKind): GenerationKind {
  return builderKind === "general"
    ? GENERATION_KIND_GENERAL
    : GENERATION_KIND_JD;
}

export async function loadOwnedGenerationResume(
  userId: string,
  generationId: string,
  builderKind: DraftRefineBuilderKind,
): Promise<
  | { ok: true; resume: GeneratedResume }
  | { ok: false; status: 404 | 400; error: string }
> {
  const kind = kindForBuilder(builderKind);
  const generation = await prisma.generation.findFirst({
    where: { id: generationId, userId, kind },
    select: { resumeJson: true },
  });
  if (!generation) {
    return {
      ok: false,
      status: 404,
      error: "Generation was not found.",
    };
  }
  if (!generation.resumeJson) {
    return {
      ok: false,
      status: 400,
      error: "No draft resume is stored for this generation yet.",
    };
  }

  let parsed: ReturnType<typeof parseGeneratedResume>;
  try {
    parsed = parseGeneratedResume(JSON.parse(generation.resumeJson));
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Stored draft resume is invalid.",
    };
  }
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error,
    };
  }

  return { ok: true, resume: parsed.data };
}

export async function persistOwnedGenerationResume(
  userId: string,
  generationId: string,
  builderKind: DraftRefineBuilderKind,
  resume: GeneratedResume,
): Promise<{ ok: false; status: 404; error: string } | { ok: true }> {
  const kind = kindForBuilder(builderKind);
  const updated = await prisma.generation.updateMany({
    where: { id: generationId, userId, kind },
    data: {
      resumeJson: JSON.stringify(resume),
      evaluationMarkdown: null,
    },
  });
  if (updated.count === 0) {
    return {
      ok: false,
      status: 404,
      error: "Generation was not found.",
    };
  }
  return { ok: true };
}
