import { runOpenAiMarkdownFormatResponse } from "../openai/responses.js";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildMarkdownFormatUserMessage,
  getMarkdownFormatSystemMessage,
  normalizeFormattedMarkdown,
  validateFormattedMarkdown,
} from "./prompts.js";
import type {
  MarkdownFormatProvider,
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types.js";

export const openAiMarkdownFormatProvider: MarkdownFormatProvider = {
  id: "openai",

  async run(input: MarkdownFormatRequest): Promise<MarkdownFormatResult> {
    const instructions = getMarkdownFormatSystemMessage();
    const user = buildMarkdownFormatUserMessage(input);
    const maxLen = input.text.length + 5000;
    const response = await runOpenAiMarkdownFormatResponse(
      input.apiKey,
      instructions,
      user,
    );

    const markdown = normalizeFormattedMarkdown(response.outputText);
    validateFormattedMarkdown(markdown, maxLen);

    return {
      markdown,
      usage: buildUsage(`${instructions}\n\n${user}`, markdown, {
        inputToken: response.inputToken,
        outputToken: response.outputToken,
      }),
    };
  },
};
