import { runOpenAiAuthorAdviseResponse } from "../openai/responses";
import { loadExperienceIndex } from "../ai-combine-recommend/load-index";
import { parseCombineRecommendResponse } from "../ai-combine-recommend/parse-response";
import {
  buildCombineRecommendRefMaps,
  humanizeRefTokensInWarnings,
} from "../ai-combine-recommend/refs";
import type { ExperienceDimensionMode } from "../resume-generation-policy";
import {
  buildUsage,
  type CombineRecommendProviderResult,
  type CombineRecommendRunCompany,
} from "../ai-combine-recommend/types";
import {
  buildGeneralCombineRecommendUserPrompt,
  getGeneralCombineRecommendSystemPrompt,
} from "./prompts";

export { loadExperienceIndex };

export type GeneralCombineRecommendRunInput = {
  apiKey: string;
  profileId: string;
  userInstruction: string;
  platform: string;
  companies: CombineRecommendRunCompany[];
  experienceIndex: Array<{
    id: string;
    category: string;
    problemSummary: string;
  }>;
};

export async function runGeneralCombineRecommend(
  input: GeneralCombineRecommendRunInput,
  maxExperiencesPerCompany = 5,
  experienceDimensionMode: ExperienceDimensionMode = "technical_facet",
  minExperiencesPerCompany?: number | null,
): Promise<CombineRecommendProviderResult> {
  const refMaps = buildCombineRecommendRefMaps({
    experienceIds: input.experienceIndex.map((item) => item.id),
    companyIds: input.companies.map((item) => item.companyId),
  });

  const instructions = getGeneralCombineRecommendSystemPrompt(
    maxExperiencesPerCompany,
    experienceDimensionMode,
    minExperiencesPerCompany,
  );
  const user = buildGeneralCombineRecommendUserPrompt({
    profileId: input.profileId,
    userInstruction: input.userInstruction,
    platform: input.platform,
    companies: input.companies,
    experienceIndex: input.experienceIndex,
    experienceDimensionMode,
  });

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

  const usage = buildUsage(`${instructions}\n\n${user}`, response.outputText, {
    inputToken: response.inputToken,
    outputToken: response.outputToken,
  });

  return {
    result: { ...parsed.result, warnings },
    usage,
  };
}
