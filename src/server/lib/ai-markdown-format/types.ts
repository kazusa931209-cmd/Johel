import type { AiProviderId } from "../ai-provider";
import type { AiVerdictUsage } from "../ai-verdict/types";

export type MarkdownFormatKind =
  | "verdict"
  | "generate"
  | "evaluate"
  | "refine"
  | "companyWhatItIs"
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

export type MarkdownFormatProvider = {
  id: AiProviderId;
  run(input: MarkdownFormatRequest): Promise<MarkdownFormatResult>;
};
