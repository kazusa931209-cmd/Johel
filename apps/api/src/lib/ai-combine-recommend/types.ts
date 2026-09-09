export type CombineRecommendMode = "auto" | "guided";

export type CombineRecommendCompanyInput = {
  companyId: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  experienceIds: string[];
};

export type CombineRecommendRequest = {
  apiKey: string;
  jobDescription: string;
  acceptedMarkdown?: string;
  mode: CombineRecommendMode;
  /** Required when mode is guided — comma-separated steering keywords (e.g. AWS, Blockchain, Senior). */
  guidanceKeywords?: string;
  profileId: string;
  companies: CombineRecommendCompanyInput[];
};

export type CombineRecommendCompanyResult = {
  companyId: string;
  experienceIds: string[];
  rationale: string;
};

export type CombineRecommendResult = {
  companies: CombineRecommendCompanyResult[];
  warnings: string[];
};

export type CombineRecommendUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type CombineRecommendProviderResult = {
  result: CombineRecommendResult;
  usage: CombineRecommendUsage;
};

export type ExperienceIndexItem = {
  id: string;
  category: string;
  problemSummary: string;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): CombineRecommendUsage {
  const inputToken =
    exact?.inputToken != null && Number.isFinite(exact.inputToken)
      ? Math.max(0, Math.round(exact.inputToken))
      : estimateTokens(inputText);
  const outputToken =
    exact?.outputToken != null && Number.isFinite(exact.outputToken)
      ? Math.max(0, Math.round(exact.outputToken))
      : estimateTokens(outputText);

  return {
    inputToken,
    outputToken,
    input: inputText,
    output: outputText,
  };
}
