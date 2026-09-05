export const PROMPT_COMPILER_VERSION = "1";

export type PromptInstructionKind = "verdict" | "generate" | "evaluate";

export function compileInstruction(
  kind: PromptInstructionKind,
  originalPrompt: string,
): string {
  const trimmed = originalPrompt.trim().replace(/\n{3,}/g, "\n\n");
  const wrapped = `## User instruction\n\n${trimmed}\n\n---`;

  if (kind === "generate") {
    return `${wrapped}\n\nDo not invent employers, dates, skills, or experience not present in the supplied input data.`;
  }

  return wrapped;
}
