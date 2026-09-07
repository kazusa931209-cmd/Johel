export type WorkflowRecommendExperienceSummary = {
  id: string;
  category: string;
  description: string;
};

export type WorkflowRecommendCompanySummary = {
  name: string;
  startDate: string;
  endDate: string;
  experienceIds: string[];
};

export type WorkflowRecommendSummary = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  profileName: string;
  experiences: WorkflowRecommendExperienceSummary[];
  companies: WorkflowRecommendCompanySummary[];
};

export type WorkflowRecommendMatch = {
  workflowId: string;
  score: number;
};

export type WorkflowRecommendAiResult = {
  matches: WorkflowRecommendMatch[];
};

export type WorkflowRecommendRequest = {
  apiKey: string;
  jobDescription: string;
  acceptedMarkdown?: string;
  workflows: WorkflowRecommendSummary[];
};

export type WorkflowRecommendUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type WorkflowRecommendProviderResult = {
  matches: WorkflowRecommendMatch[];
  usage: WorkflowRecommendUsage;
};

export type { AiProviderId } from "../ai-provider.js";

export type WorkflowRecommendProvider = {
  id: import("../ai-provider.js").AiProviderId;
  run(
    input: WorkflowRecommendRequest,
  ): Promise<WorkflowRecommendProviderResult>;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): WorkflowRecommendUsage {
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
