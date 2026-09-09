import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import { loadExperienceIndex } from "./load-index.js";
import {
  buildCombineRecommendUserPrompt,
  getCombineRecommendSystemPrompt,
} from "./prompts.js";
import { parseCombineRecommendResponse } from "./parse-response.js";
import {
  buildUsage,
  type CombineRecommendProviderResult,
  type CombineRecommendRequest,
  type CombineRecommendRunCompany,
} from "./types.js";

export { loadExperienceIndex };

export type CombineRecommendRunInput = Omit<
  CombineRecommendRequest,
  "companies"
> & {
  companies: CombineRecommendRunCompany[];
  experienceIndex: Array<{
    id: string;
    category: string;
    problemSummary: string;
  }>;
};

export async function runCombineRecommend(
  input: CombineRecommendRunInput,
): Promise<CombineRecommendProviderResult> {
  const instructions = getCombineRecommendSystemPrompt();
  const user = buildCombineRecommendUserPrompt(input);
  const allowedExperienceIds = new Set(
    input.experienceIndex.map((item) => item.id),
  );
  const allowedCompanyIds = new Set(
    input.companies.map((item) => item.companyId),
  );

  const response = await runOpenAiAuthorAdviseResponse(
    input.apiKey,
    instructions,
    user,
  );

  const parsed = parseCombineRecommendResponse(
    response.outputText,
    allowedExperienceIds,
    allowedCompanyIds,
  );
  if (!parsed.success) {
    throw new Error(parsed.error);
  }

  return {
    result: parsed.result,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}
