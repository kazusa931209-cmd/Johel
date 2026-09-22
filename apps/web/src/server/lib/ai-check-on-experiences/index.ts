import { openAiCheckOnExperiencesProvider } from "./openai-provider";
import type { AiProviderId } from "../ai-provider";
import type {
  CheckOnExperiencesRunInput,
  CheckOnExperiencesRunResult,
} from "./types";

export type {
  CheckOnExperiencesRunInput,
  CheckOnExperiencesRunResult,
  CheckOnExperiencesVerdict,
} from "./types";
export { extractLinkedExperienceIds } from "./extract-linked-ids";
export {
  buildCheckOnExperiencesUserPrompt,
  getCheckOnExperiencesSystemPrompt,
} from "./prompts";
export { parseCheckOnExperiencesResponse } from "./parse-response";
export { formatCheckOnExperiencesMarkdown } from "./format-markdown";

export async function runAiCheckOnExperiences(
  _provider: AiProviderId,
  input: CheckOnExperiencesRunInput,
): Promise<CheckOnExperiencesRunResult> {
  return openAiCheckOnExperiencesProvider.run(input);
}
