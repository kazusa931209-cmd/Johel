export type { AiProviderId } from "../ai-provider.js";

export type ExperienceAdvisePlacement =
  | "create_experience"
  | "update_experience"
  | "need_more_facts";

export type ExperienceAdviseDraft = {
  category: string | null;
  problem: string | null;
  actions: string | null;
  outcome: string | null;
};

export type ExperienceAdviseOperation = {
  placement: ExperienceAdvisePlacement;
  rationale: string;
  targetExperienceId: string | null;
  draft: ExperienceAdviseDraft;
  warnings: string[];
};

export type ExperienceAdviseGraphExperience = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

export type ExperienceAdviseGraph = {
  experiences: ExperienceAdviseGraphExperience[];
  targetExperienceId: string | null;
};

export type ExperienceAdviseResult = {
  rationale: string;
  questions: string[];
  operations: ExperienceAdviseOperation[];
};

export type ExperienceAdviseRequest = {
  apiKey: string;
  graph: ExperienceAdviseGraph;
  userFacts: string;
};

export type ExperienceAdviseUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type ExperienceAdviseProviderResult = {
  result: ExperienceAdviseResult;
  usage: ExperienceAdviseUsage;
};

export type ExperienceAdviseProvider = {
  id: import("../ai-provider.js").AiProviderId;
  run(input: ExperienceAdviseRequest): Promise<ExperienceAdviseProviderResult>;
};

export type ExperienceAdviseApplyOperation = {
  placement: "create_experience" | "update_experience";
  targetExperienceId: string | null;
  draft: ExperienceAdviseDraft;
};

export type ExperienceAdviseApplyInput = {
  userId: string;
  workspaceFingerprint: string;
  operations: ExperienceAdviseApplyOperation[];
};

export type ExperienceAdviseApplyResult = {
  experienceIds: string[];
  warnings: string[];
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): ExperienceAdviseUsage {
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
