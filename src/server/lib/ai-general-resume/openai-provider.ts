import { runOpenAiResumeResponse } from "../openai/responses";
import {
  finalizeResumeSummaryCareerYears,
  normalizeEducationDatesInResume,
} from "../ai-resume/career-years";
import { parseAiResumeJsonResponse } from "../ai-resume/parse-response";
import {
  buildUsage,
  type AiResumeProvider,
  type AiResumeRequest,
  type AiResumeProviderResult,
} from "../ai-resume/types";
import {
  buildGeneralAiResumeUserPrompt,
  getGeneralAiResumeSystemPrompt,
} from "./prompts";

export const openAiGeneralResumeProvider: AiResumeProvider = {
  id: "openai",

  async run(input: AiResumeRequest): Promise<AiResumeProviderResult> {
    const instructions = getGeneralAiResumeSystemPrompt(
      "openai",
      input.generatePrompt,
    );
    const user = buildGeneralAiResumeUserPrompt(input.input);

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
