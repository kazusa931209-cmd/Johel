import { openAiCheckGapsProvider } from "./openai-provider.js";
import type { AiProviderId } from "../ai-provider.js";
import type { CheckGapsRunInput, CheckGapsRunResult } from "./types.js";

export type {
  CheckGapsRunInput,
  CheckGapsRunResult,
  CheckGapsVerdict,
} from "./types.js";
export { extractLinkedExperienceIds } from "./extract-linked-ids.js";
export {
  buildCheckGapsUserPrompt,
  getCheckGapsSystemPrompt,
} from "./prompts.js";
export { parseCheckGapsResponse } from "./parse-response.js";
export { formatCheckGapsMarkdown } from "./format-markdown.js";

export async function runAiCheckGaps(
  _provider: AiProviderId,
  input: CheckGapsRunInput,
): Promise<CheckGapsRunResult> {
  return openAiCheckGapsProvider.run(input);
}
