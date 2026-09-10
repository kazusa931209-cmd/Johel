import type { GeneratedResume } from "@johel/resume";

import type { AiProviderId } from "../ai-provider.js";

export type { AiProviderId };

export type AiResumeUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type ResumeGenerationProfile = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  pn: string | null;
  residence: string | null;
  university: string | null;
  graduationYear: number | null;
  graduationMonth: number | null;
  degree: string | null;
  links: { key: string; link: string | null }[];
};

export type ResumeGenerationExperience = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

export type ResumeGenerationCompany = {
  id: string;
  alias: string;
  name: string;
  whatCompanyIs: string;
  domainAndStack: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  experiences: ResumeGenerationExperience[];
};

export type ResumeGenerationRun = {
  language: string;
  emphasis: string;
};

export type ResumeGenerationInput = {
  jobContext: string;
  profile: ResumeGenerationProfile;
  companies: ResumeGenerationCompany[];
  run: ResumeGenerationRun;
};

export type AiResumeRequest = {
  apiKey: string;
  generatePrompt: string;
  input: ResumeGenerationInput;
};

export type AiResumeProviderResult = {
  resume: GeneratedResume;
  usage: AiResumeUsage;
};

export type AiResumeProvider = {
  id: AiProviderId;
  run(input: AiResumeRequest): Promise<AiResumeProviderResult>;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): AiResumeUsage {
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
