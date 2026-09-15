import { runOpenAiResumeResponse } from "../openai/responses.js";
import {
  finalizeResumeSummaryCareerYears,
  normalizeEducationDatesInResume,
} from "./career-years.js";
import { parseAiResumeJsonResponse } from "./parse-response.js";
import {
  buildAiResumeUserPrompt,
  getAiResumeSystemPrompt,
} from "./prompts.js";
import {
  buildUsage,
  type AiResumeProvider,
  type AiResumeRequest,
  type AiResumeProviderResult,
} from "./types.js";

export const openAiResumeProvider: AiResumeProvider = {
  id: "openai",

  async run(input: AiResumeRequest): Promise<AiResumeProviderResult> {
    const instructions = getAiResumeSystemPrompt("openai", input.generatePrompt);
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
