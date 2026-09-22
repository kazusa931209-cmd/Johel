import { runOpenAiAuthorAdviseResponse } from "../openai/responses";
import {
  buildExperienceSplitUserPrompt,
  getExperienceSplitSystemPrompt,
} from "./prompts";
import { parseExperienceSplitResponse } from "./parse-response";
import {
  buildUsage,
  type ExperienceSplitProviderResult,
  type ExperienceSplitRequest,
} from "./types";

export type {
  ExperienceSplitApplyInput,
  ExperienceSplitApplyResult,
  ExperienceSplitResult,
} from "./types";

export {
  buildPoolIndexFromRows,
  buildExperienceSplitUserPrompt,
  getExperienceSplitSystemPrompt,
} from "./prompts";
export { parseExperienceSplitResponse } from "./parse-response";
export { applyExperienceSplitOperations } from "./apply";

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
