import type { AiProviderId } from "../ai-provider.js";
import type { AiVerdictUsage } from "../ai-verdict/types.js";

export type PromptHelperKind =
  | "verdict"
  | "generate"
  | "evaluate"
  | "companyDescription"
  | "experienceDescription";

export type PromptHelperRequest = {
  kind: PromptHelperKind;
  currentPrompt: string;
  request: string;
  apiKey: string;
};

export type PromptHelperResult = {
  sentence: string;
  usage: AiVerdictUsage;
};

export type PromptHelperProvider = {
  id: AiProviderId;
  run(input: PromptHelperRequest): Promise<PromptHelperResult>;
};
