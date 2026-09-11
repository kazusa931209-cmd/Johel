import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import { loadExperienceIndex } from "./load-index.js";
import {
  buildCombineRecommendUserPrompt,
  getCombineRecommendSystemPrompt,
} from "./prompts.js";
import { parseCombineRecommendResponse } from "./parse-response.js";
import {
  buildCombineRecommendRefMaps,
  humanizeRefTokensInWarnings,
} from "./refs.js";
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
  maxExperiencesPerCompany = 5,
): Promise<CombineRecommendProviderResult> {
  const refMaps = buildCombineRecommendRefMaps({
    experienceIds: input.experienceIndex.map((item) => item.id),
    companyIds: input.companies.map((item) => item.companyId),
  });

  const instructions = getCombineRecommendSystemPrompt(maxExperiencesPerCompany);
  const user = buildCombineRecommendUserPrompt(input);

  const response = await runOpenAiAuthorAdviseResponse(
    input.apiKey,
    instructions,
    user,
  );

  const parsed = parseCombineRecommendResponse(
    response.outputText,
    refMaps,
    maxExperiencesPerCompany,
  );
  if (!parsed.success) {
    throw new Error(parsed.error);
  }

  const warnings = humanizeRefTokensInWarnings(parsed.result.warnings, refMaps, {
    companyNameById: new Map(
      input.companies.map((company) => [company.companyId, company.name]),
    ),
    experienceCategoryById: new Map(
      input.experienceIndex.map((experience) => [
        experience.id,
        experience.category,
      ]),
    ),
  });

  return {
    result: {
      ...parsed.result,
      warnings,
    },
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}
