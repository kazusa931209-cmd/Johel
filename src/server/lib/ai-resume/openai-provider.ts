import { runOpenAiResumeResponse } from "../openai/responses";
import {
  finalizeResumeSummaryCareerYears,
  normalizeEducationDatesInResume,
} from "./career-years";
import { parseAiResumeJsonResponse } from "./parse-response";
import {
  buildAiResumeUserPrompt,
  getAiResumeSystemPrompt,
} from "./prompts";
import {
  buildUsage,
  type AiResumeProvider,
  type AiResumeRequest,
  type AiResumeProviderResult,
} from "./types";

export const openAiResumeProvider: AiResumeProvider = {
  id: "openai",

  async run(input: AiResumeRequest): Promise<AiResumeProviderResult> {
    const instructions = getAiResumeSystemPrompt(
      "openai",
      input.generatePrompt,
      input.input.generationPolicy.experienceJdTierDecayPercent,
    );
    const user = buildAiResumeUserPrompt(input.input);

    const response = await runOpenAiResumeResponse(
      input.apiKey,
      instructions,
      user,
    );

    const raw = response.outputText;
    const parsed = parseAiResumeJsonResponse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, raw, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    const resume = normalizeEducationDatesInResume(
      finalizeResumeSummaryCareerYears(
        parsed.data,
        input.input.companies,
        input.input.run.language,
      ),
    );

    return { resume, usage };
  },
};
