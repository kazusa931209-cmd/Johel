import type { AiProviderId } from "../ai-provider.js";
import { buildUsage } from "../ai-verdict/types.js";
import { runOpenAiSolResponse } from "../openai/responses.js";
import {
  buildCompanyFieldsFormatUserMessage,
  getCompanyFieldsFormatSystemMessage,
  parseCompanyFieldsFormatResponse,
} from "./prompts.js";
import type {
  CompanyFieldsMarkdownFormatRequest,
  CompanyFieldsMarkdownFormatResult,
} from "./types.js";

async function runOpenAiCompanyFieldsFormat(
  input: CompanyFieldsMarkdownFormatRequest,
): Promise<CompanyFieldsMarkdownFormatResult> {
  const instructions = getCompanyFieldsFormatSystemMessage();
  const user = buildCompanyFieldsFormatUserMessage(input);
  const response = await runOpenAiSolResponse(input.apiKey, instructions, user, {
    jsonOutput: true,
  });

  const fields = parseCompanyFieldsFormatResponse(response.outputText, 20_000);

  return {
    ...fields,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}

export async function runAiCompanyFieldsMarkdownFormat(
  _provider: AiProviderId,
  input: CompanyFieldsMarkdownFormatRequest,
): Promise<CompanyFieldsMarkdownFormatResult> {
  return runOpenAiCompanyFieldsFormat(input);
}
