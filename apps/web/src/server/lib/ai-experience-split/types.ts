import type { ExperienceAdviseDraft } from "../ai-experience-advise/types";

export type ExperienceSplitTarget = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

export type ExperienceSplitIndexItem = {
  id: string;
  category: string;
  problemSummary: string;
};

export type ExperienceSplitOperation = {
  placement: "create_experience";
  rationale: string;
  draft: ExperienceAdviseDraft;
  warnings: string[];
};

export type ExperienceSplitResult = {
  rationale: string;
  questions: string[];
  operations: ExperienceSplitOperation[];
  warnings: string[];
};

export type ExperienceSplitRequest = {
  apiKey: string;
  target: ExperienceSplitTarget;
  poolIndex: ExperienceSplitIndexItem[];
};

export type ExperienceSplitUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type ExperienceSplitProviderResult = {
  result: ExperienceSplitResult;
  usage: ExperienceSplitUsage;
};

export type ExperienceSplitApplyOperation = {
  placement: "create_experience";
  draft: ExperienceAdviseDraft;
};

export type ExperienceSplitApplyInput = {
  userId: string;
  experienceId: string;
  workspaceFingerprint: string;
  operations: ExperienceSplitApplyOperation[];
};

export type ExperienceSplitApplyResult = {
  experienceIds: string[];
  archivedId: string;
  warnings: string[];
};

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): ExperienceSplitUsage {
  const inputToken =
    exact?.inputToken != null && Number.isFinite(exact.inputToken)
      ? Math.max(0, Math.round(exact.inputToken))
      : Math.max(1, Math.ceil(inputText.length / 4));
  const outputToken =
    exact?.outputToken != null && Number.isFinite(exact.outputToken)
      ? Math.max(0, Math.round(exact.outputToken))
      : Math.max(1, Math.ceil(outputText.length / 4));

  return {
    inputToken,
    outputToken,
    input: inputText,
    output: outputText,
  };
}
