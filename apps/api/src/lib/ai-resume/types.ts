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
  education: string | null;
  links: { key: string; link: string | null }[];
};

export type ResumeGenerationExperience = {
  id: string;
  category: string;
  description: string;
};

export type ResumeGenerationCompany = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  experiences: ResumeGenerationExperience[];
};

export type ResumeGenerationWorkflow = {
  id: string;
  name: string;
  description: string;
  language: string;
};

export type ResumeGenerationInput = {
  jobDescription: string;
  acceptedMarkdown: string;
  profile: ResumeGenerationProfile;
  companies: ResumeGenerationCompany[];
  workflow: ResumeGenerationWorkflow;
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
