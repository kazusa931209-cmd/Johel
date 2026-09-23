import { prisma } from "./prisma";

/** Prompt fields used by `POST /ai-draft-refine` (see `Prompt` in Prisma schema). */
export type DraftRefinePromptRow = {
  generatePrompt: string;
  generateExtension: string;
  refinePrompt: string;
  refineExtension: string;
};

export async function findDraftRefinePromptRow(
  userId: string,
): Promise<DraftRefinePromptRow | null> {
  const row = await prisma.prompt.findUnique({
    where: { userId },
    select: {
      generatePrompt: true,
      generateExtension: true,
      refinePrompt: true,
      refineExtension: true,
    },
  });

  return row as DraftRefinePromptRow | null;
}

export function resolveDraftRefineBasePrompt(
  prompts: DraftRefinePromptRow | null,
  builderKind: "jd" | "general",
  defaultRefinePrompt: string,
): string {
  if (builderKind === "general") {
    return prompts?.refinePrompt.trim() || defaultRefinePrompt;
  }
  return prompts?.generatePrompt.trim() ?? "";
}

export function resolveDraftRefineExtension(
  prompts: DraftRefinePromptRow | null,
  builderKind: "jd" | "general",
): string {
  if (builderKind === "general") {
    return prompts?.refineExtension.trim() ?? "";
  }
  return prompts?.generateExtension.trim() ?? "";
}
