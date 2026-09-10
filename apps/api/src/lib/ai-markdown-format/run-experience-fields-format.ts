import type { AiProviderId } from "../ai-provider.js";
import { buildUsage } from "../ai-verdict/types.js";
import { runOpenAiSolResponse } from "../openai/responses.js";
import {
  buildExperienceFieldsFormatUserMessage,
  getExperienceFieldsFormatSystemMessage,
  parseExperienceFieldsFormatResponse,
} from "./prompts.js";
import type {
  ExperienceFieldsMarkdownFormatRequest,
  ExperienceFieldsMarkdownFormatResult,
} from "./types.js";

async function runOpenAiExperienceFieldsFormat(
  input: ExperienceFieldsMarkdownFormatRequest,
): Promise<ExperienceFieldsMarkdownFormatResult> {
  const instructions = getExperienceFieldsFormatSystemMessage();
  const user = buildExperienceFieldsFormatUserMessage(input);
  const response = await runOpenAiSolResponse(input.apiKey, instructions, user, {
    jsonOutput: true,
  });

  const fields = parseExperienceFieldsFormatResponse(
    response.outputText,
    20_000,
  );

  return {
    ...fields,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}

export async function runAiExperienceFieldsMarkdownFormat(
  _provider: AiProviderId,
  input: ExperienceFieldsMarkdownFormatRequest,
): Promise<ExperienceFieldsMarkdownFormatResult> {
  return runOpenAiExperienceFieldsFormat(input);
}
