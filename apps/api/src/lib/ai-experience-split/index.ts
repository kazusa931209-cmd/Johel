import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import {
  buildExperienceSplitUserPrompt,
  getExperienceSplitSystemPrompt,
} from "./prompts.js";
import { parseExperienceSplitResponse } from "./parse-response.js";
import {
  buildUsage,
  type ExperienceSplitProviderResult,
  type ExperienceSplitRequest,
} from "./types.js";

export type {
  ExperienceSplitApplyInput,
  ExperienceSplitApplyResult,
  ExperienceSplitResult,
} from "./types.js";

export {
  buildPoolIndexFromRows,
  buildExperienceSplitUserPrompt,
  getExperienceSplitSystemPrompt,
} from "./prompts.js";
export { parseExperienceSplitResponse } from "./parse-response.js";
export { applyExperienceSplitOperations } from "./apply.js";

export async function runExperienceSplit(
  input: ExperienceSplitRequest,
): Promise<ExperienceSplitProviderResult> {
  const instructions = getExperienceSplitSystemPrompt();
  const user = buildExperienceSplitUserPrompt(input);

  const response = await runOpenAiAuthorAdviseResponse(
    input.apiKey,
    instructions,
    user,
  );

  const parsed = parseExperienceSplitResponse(response.outputText);
  if (!parsed.success) {
    throw new Error(parsed.error);
  }

  return {
    result: parsed.result,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}
