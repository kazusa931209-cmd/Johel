export const PROMPT_COMPILER_VERSION = "2";

export const PROMPT_SECTION_SEPARATOR = "----------------------------------------";

export type PromptInstructionKind = "verdict" | "generate" | "evaluate";

export function compileInstruction(
  _kind: PromptInstructionKind,
  originalPrompt: string,
): string {
  const trimmed = originalPrompt.trim().replace(/\n{3,}/g, "\n\n");
  return `# Instructions\n\n${trimmed}\n\n${PROMPT_SECTION_SEPARATOR}\n\n`;
}

export function appendOneTimeGeneratePrompt(
  compiledGeneratePrompt: string,
  oneTimePrompt?: string,
): string {
  const trimmed = oneTimePrompt?.trim();
  if (!trimmed) {
    return compiledGeneratePrompt;
  }
  return `${compiledGeneratePrompt}# One-time prompt\n\n${trimmed}\n\n${PROMPT_SECTION_SEPARATOR}\n\n`;
}
