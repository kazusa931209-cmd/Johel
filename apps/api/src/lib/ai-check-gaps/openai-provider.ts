import { runOpenAiJdMetaResponse } from "../openai/responses.js";
import { buildUsage } from "../ai-verdict/types.js";
import { buildCheckGapsUserPrompt, getCheckGapsSystemPrompt } from "./prompts.js";
import { parseCheckGapsResponse } from "./parse-response.js";
import { formatCheckGapsMarkdown } from "./format-markdown.js";
import type { CheckGapsProvider, CheckGapsRunInput, CheckGapsRunResult } from "./types.js";

export const openAiCheckGapsProvider: CheckGapsProvider = {
  id: "openai",

  async run(input: CheckGapsRunInput): Promise<CheckGapsRunResult> {
    const hasGenerationContext = input.linkedExperienceIds !== null;
    const instructions = getCheckGapsSystemPrompt(hasGenerationContext);
    const user = buildCheckGapsUserPrompt(input);

    const response = await runOpenAiJdMetaResponse(
      input.apiKey,
      instructions,
      user,
    );

    const outputText = response.outputText;
    if (!outputText) {
      throw new Error("OpenAI returned empty JSON.");
    }

    const parsed = parseCheckGapsResponse(outputText, hasGenerationContext);

    const experienceById = new Map(
      input.graph.experiences.map((experience) => [experience.id, experience]),
    );
    const matchedExperiences = parsed.matchedExperienceIds
      .map((id) => experienceById.get(id))
      .filter((experience): experience is NonNullable<typeof experience> =>
        Boolean(experience),
      )
      .map((experience) => ({
        id: experience.id,
        category: experience.category,
      }));

    const markdown = formatCheckGapsMarkdown(
      parsed.verdict,
      parsed.explanation,
      matchedExperiences,
      hasGenerationContext,
    );

    const usage = buildUsage(`${instructions}\n\n${user}`, outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return {
      verdict: parsed.verdict,
      matchedExperienceIds: parsed.matchedExperienceIds,
      markdown,
      usage,
    };
  },
};
