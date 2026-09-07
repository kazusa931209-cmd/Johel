import type {
  ResumeGenerationCompany,
  ResumeGenerationProfile,
} from "../ai-resume/types.js";

export type { AiProviderId } from "../ai-provider.js";

export type AuthorAdvisePlacement =
  | "create_experience"
  | "update_experience"
  | "link_existing"
  | "update_company"
  | "update_role_context"
  | "update_workflow_description"
  | "need_more_facts";

export type AuthorAdviseDraft = {
  category: string | null;
  problem: string | null;
  actions: string | null;
  outcome: string | null;
  whatCompanyIs: string | null;
  domainAndStack: string | null;
  roleContext: string | null;
  workflowDescription: string | null;
};

export type AuthorAdviseTarget = {
  workflowId: string | null;
  experienceId: string | null;
  companyId: string | null;
};

export type AuthorAdviseLink = {
  workflowId: string | null;
  companyId: string | null;
  experienceId: string | null;
};

export type AuthorAdviseProposal = {
  placement: AuthorAdvisePlacement;
  rationale: string;
  questions: string[];
  target: AuthorAdviseTarget;
  draft: AuthorAdviseDraft;
  link: AuthorAdviseLink;
  warnings: string[];
};

export type AuthorAdviseWorkflowGraph = {
  workflowId: string;
  workflow: {
    id: string;
    name: string;
    description: string;
    language: string;
  };
  profile: ResumeGenerationProfile | null;
  companies: ResumeGenerationCompany[];
};

export type AuthorAdviseGraph = {
  scope: "one" | "all";
  workflows: AuthorAdviseWorkflowGraph[];
};

export type AuthorAdviseRequest = {
  apiKey: string;
  graph: AuthorAdviseGraph;
  userFacts: string;
};

export type AuthorAdviseUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type AuthorAdviseProviderResult = {
  proposal: AuthorAdviseProposal;
  usage: AuthorAdviseUsage;
};

export type AuthorAdviseProvider = {
  id: import("../ai-provider.js").AiProviderId;
  run(input: AuthorAdviseRequest): Promise<AuthorAdviseProviderResult>;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): AuthorAdviseUsage {
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
