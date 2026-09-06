import { runOpenAiVerdictResponse } from "../openai/responses.js";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildPromptHelperUserMessage,
  getPromptHelperSystemMessage,
  normalizePromptHelperSentence,
} from "./prompts.js";
import type {
  PromptHelperProvider,
  PromptHelperRequest,
  PromptHelperResult,
} from "./types.js";

export const openAiPromptHelperProvider: PromptHelperProvider = {
  id: "openai",

  async run(input: PromptHelperRequest): Promise<PromptHelperResult> {
    const instructions = getPromptHelperSystemMessage();
    const user = buildPromptHelperUserMessage(input);
    const response = await runOpenAiVerdictResponse(
      input.apiKey,
      instructions,
      user,
    );

    const sentence = normalizePromptHelperSentence(response.outputText);
    if (!sentence) {
      throw new Error("OpenAI returned empty text.");
    }

    return {
      sentence,
      usage: buildUsage(`${instructions}\n\n${user}`, sentence, {
        inputToken: response.inputToken,
        outputToken: response.outputToken,
      }),
    };
  },
};
