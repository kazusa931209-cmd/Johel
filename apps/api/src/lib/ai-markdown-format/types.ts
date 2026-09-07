import type { AiProviderId } from "../ai-provider.js";
import type { AiVerdictUsage } from "../ai-verdict/types.js";

export type MarkdownFormatKind =
  | "verdict"
  | "generate"
  | "evaluate"
  | "companyWhatItIs"
  | "companyDomainAndStack"
  | "experienceDescription";

export type MarkdownFormatRequest = {
  kind: MarkdownFormatKind;
  text: string;
  apiKey: string;
};

export type MarkdownFormatResult = {
  markdown: string;
  usage: AiVerdictUsage;
};

export type MarkdownFormatProvider = {
  id: AiProviderId;
  run(input: MarkdownFormatRequest): Promise<MarkdownFormatResult>;
};
