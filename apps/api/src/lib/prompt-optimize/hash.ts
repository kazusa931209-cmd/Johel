import { createHash } from "node:crypto";
import { PROMPT_COMPILER_VERSION, type PromptInstructionKind } from "./compile.js";

export function hashPromptSource(
  kind: PromptInstructionKind,
  originalPrompt: string,
): string {
  return createHash("sha256")
    .update(PROMPT_COMPILER_VERSION)
    .update("\0")
    .update(kind)
    .update("\0")
    .update(originalPrompt.trim())
    .digest("hex");
}
