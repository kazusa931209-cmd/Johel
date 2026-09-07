import { runOpenAiWorkflowRecommendResponse } from "../openai/responses.js";
import {
  buildWorkflowRecommendUserPrompt,
  getWorkflowRecommendSystemPrompt,
} from "./prompts.js";
import { parseWorkflowRecommendResponse } from "./parse-response.js";
import {
  buildUsage,
  type WorkflowRecommendProvider,
  type WorkflowRecommendRequest,
  type WorkflowRecommendProviderResult,
} from "./types.js";

export const openAiWorkflowRecommendProvider: WorkflowRecommendProvider = {
  id: "openai",

  async run(
    input: WorkflowRecommendRequest,
  ): Promise<WorkflowRecommendProviderResult> {
    const instructions = getWorkflowRecommendSystemPrompt("openai");
    const user = buildWorkflowRecommendUserPrompt(input);

    const response = await runOpenAiWorkflowRecommendResponse(
      input.apiKey,
      instructions,
      user,
    );

    const raw = response.outputText;
    const parsed = parseWorkflowRecommendResponse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, raw, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return { matches: parsed.matches, usage };
  },
};
