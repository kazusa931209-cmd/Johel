import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import {
  buildExperienceAdviseUserPrompt,
  getExperienceAdviseSystemPrompt,
} from "./prompts.js";
import { parseExperienceAdviseResponse } from "./parse-response.js";
import {
  buildUsage,
  type ExperienceAdviseProvider,
  type ExperienceAdviseRequest,
  type ExperienceAdviseProviderResult,
} from "./types.js";

function graphExperienceIds(
  graph: ExperienceAdviseRequest["graph"],
): Set<string> {
  return new Set(graph.experiences.map((item) => item.id));
}

export const openAiExperienceAdviseProvider: ExperienceAdviseProvider = {
  id: "openai",

  async run(
    input: ExperienceAdviseRequest,
  ): Promise<ExperienceAdviseProviderResult> {
    const instructions = getExperienceAdviseSystemPrompt();
    const user = buildExperienceAdviseUserPrompt(input);
    const ids = graphExperienceIds(input.graph);

    const response = await runOpenAiAuthorAdviseResponse(
      input.apiKey,
      instructions,
      user,
    );

    const raw = response.outputText;
    const parsed = parseExperienceAdviseResponse(raw, ids);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, raw, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return { result: parsed.result, usage };
  },
};
