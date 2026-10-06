import { runOpenAiResumeResponse } from "../openai/responses";
import { normalizeEducationDatesInResume } from "../ai-resume/career-years";
import { parseAiResumeJsonResponse } from "../ai-resume/parse-response";
import { buildUsage } from "../ai-resume/types";
import {
  buildDraftRefineUserPrompt,
  getDraftRefineSystemPrompt,
} from "./prompts";
import type {
  DraftRefineProvider,
  DraftRefineProviderResult,
  DraftRefineRequest,
} from "./types";

export const openAiDraftRefineProvider: DraftRefineProvider = {
  id: "openai",

  async run(input: DraftRefineRequest): Promise<DraftRefineProviderResult> {
    const instructions = getDraftRefineSystemPrompt(input.systemPrompt);
    const user = buildDraftRefineUserPrompt(input.input);

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

    const resume = normalizeEducationDatesInResume(parsed.data);

    return { resume, usage };
  },
};
