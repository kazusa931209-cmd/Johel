import { runOpenAiJdMetaResponse } from "../openai/responses";
import { buildUsage } from "../ai-verdict/types";
import {
  buildCheckOnExperiencesUserPrompt,
  getCheckOnExperiencesSystemPrompt,
} from "./prompts";
import { parseCheckOnExperiencesResponse } from "./parse-response";
import { formatCheckOnExperiencesMarkdown } from "./format-markdown";
import type {
  CheckOnExperiencesProvider,
  CheckOnExperiencesRunInput,
  CheckOnExperiencesRunResult,
} from "./types";

export const openAiCheckOnExperiencesProvider: CheckOnExperiencesProvider = {
  id: "openai",

  async run(input: CheckOnExperiencesRunInput): Promise<CheckOnExperiencesRunResult> {
    const hasGenerationContext = input.linkedExperienceIds !== null;
    const instructions = getCheckOnExperiencesSystemPrompt(hasGenerationContext);
    const user = buildCheckOnExperiencesUserPrompt(input);

    const response = await runOpenAiJdMetaResponse(
      input.apiKey,
      instructions,
      user,
    );

    const outputText = response.outputText;
    if (!outputText) {
      throw new Error("OpenAI returned empty JSON.");
    }

    const parsed = parseCheckOnExperiencesResponse(
      outputText,
      hasGenerationContext,
    );

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

    const markdown = formatCheckOnExperiencesMarkdown(
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
