import { resumeToMarkdown } from "@johel/resume";
import { runOpenAiEvaluateResponse } from "../openai/responses.js";
import {
  buildAiEvaluateUserPrompt,
  getAiEvaluateSystemPrompt,
} from "./prompts.js";
import {
  buildUsage,
  type AiEvaluateProvider,
  type AiEvaluateRequest,
  type AiEvaluateProviderResult,
} from "./types.js";

export const openAiEvaluateProvider: AiEvaluateProvider = {
  id: "openai",

  async run(input: AiEvaluateRequest): Promise<AiEvaluateProviderResult> {
    const instructions = getAiEvaluateSystemPrompt("openai", input.evaluatePrompt);
    const resumeMarkdown = resumeToMarkdown(input.resume);
    const user = buildAiEvaluateUserPrompt(
      input.jobContext,
      resumeMarkdown,
    );

    const response = await runOpenAiEvaluateResponse(
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
