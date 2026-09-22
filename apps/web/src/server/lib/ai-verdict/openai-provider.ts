import { runOpenAiVerdictResponse } from "../openai/responses";
import {
  buildAiVerdictUserPrompt,
  getAiVerdictSystemPrompt,
} from "./prompts";
import {
  buildUsage,
  type AiVerdictProvider,
  type AiVerdictRequest,
  type AiVerdictProviderResult,
} from "./types";

export const openAiVerdictProvider: AiVerdictProvider = {
  id: "openai",

  async run(input: AiVerdictRequest): Promise<AiVerdictProviderResult> {
    const instructions = getAiVerdictSystemPrompt("openai", input.verdictPrompt);
    const user = buildAiVerdictUserPrompt(input.jobDescription);

    const response = await runOpenAiVerdictResponse(
      input.apiKey,
      instructions,
      user,
    );

    const markdown = response.outputText;
    if (!markdown) {
      throw new Error("OpenAI returned empty Markdown.");
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, markdown, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return { markdown, usage };
  },
};
