import type { AiProviderId } from "../ai-provider.js";
import type { AiVerdictUsage } from "../ai-verdict/types.js";

export type MarkdownFormatKind =
  | "verdict"
  | "generate"
  | "evaluate"
  | "companyWhatItIs"
  | "companyDomainAndStack"
  | "experienceProblem"
  | "experienceActions"
  | "experienceOutcome";

export type MarkdownFormatRequest = {
  kind: MarkdownFormatKind;
  text: string;
  apiKey: string;
};

export type MarkdownFormatResult = {
  markdown: string;
  usage: AiVerdictUsage;
};

export type ExperienceFieldsMarkdownFormatRequest = {
  problem: string;
  actions: string;
  outcome: string;
  apiKey: string;
};

export type ExperienceFieldsMarkdownFormatResult = {
  problem: string;
  actions: string;
  outcome: string;
  usage: AiVerdictUsage;
};

export type CompanyFieldsMarkdownFormatRequest = {
  whatCompanyIs: string;
  domainAndStack: string;
  apiKey: string;
};

export type CompanyFieldsMarkdownFormatResult = {
  whatCompanyIs: string;
  domainAndStack: string;
  usage: AiVerdictUsage;
};

export type MarkdownFormatProvider = {
  id: AiProviderId;
  run(input: MarkdownFormatRequest): Promise<MarkdownFormatResult>;
};
