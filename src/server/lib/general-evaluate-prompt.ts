import { DEFAULT_GENERAL_EVALUATE_PROMPT } from "@johel/prompt-defaults";
import { prisma } from "./prisma";

export async function resolveGeneralEvaluatePromptSnapshot(
  userId: string,
): Promise<string> {
  const row = await prisma.prompt.findUnique({
    where: { userId },
    select: { generalEvaluatePrompt: true },
  });
  const trimmed = row?.generalEvaluatePrompt.trim();
  return trimmed || DEFAULT_GENERAL_EVALUATE_PROMPT;
}
