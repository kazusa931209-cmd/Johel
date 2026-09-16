import { openAiCheckOnExperiencesProvider } from "./openai-provider.js";
import type { AiProviderId } from "../ai-provider.js";
import type {
  CheckOnExperiencesRunInput,
  CheckOnExperiencesRunResult,
} from "./types.js";

export type {
  CheckOnExperiencesRunInput,
  CheckOnExperiencesRunResult,
  CheckOnExperiencesVerdict,
} from "./types.js";
export { extractLinkedExperienceIds } from "./extract-linked-ids.js";
export {
  buildCheckOnExperiencesUserPrompt,
  getCheckOnExperiencesSystemPrompt,
} from "./prompts.js";
export { parseCheckOnExperiencesResponse } from "./parse-response.js";
export { formatCheckOnExperiencesMarkdown } from "./format-markdown.js";

export async function runAiCheckOnExperiences(
  _provider: AiProviderId,
  input: CheckOnExperiencesRunInput,
): Promise<CheckOnExperiencesRunResult> {
  return openAiCheckOnExperiencesProvider.run(input);
}
