import type { AiProviderId } from "../ai-provider";
import { buildUsage } from "../ai-verdict/types";
import { runOpenAiSolResponse } from "../openai/responses";
import {
  buildExperienceFieldsFormatUserMessage,
  getExperienceFieldsFormatSystemMessage,
  parseExperienceFieldsFormatResponse,
} from "./prompts";
import type {
  ExperienceFieldsMarkdownFormatRequest,
  ExperienceFieldsMarkdownFormatResult,
} from "./types";

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
