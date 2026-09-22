import type { AiProviderId } from "../ai-provider";

export type { AiProviderId };

export type AiJdMetaUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type AiJdMetaRequest = {
  jobDescription: string;
  apiKey: string;
};

export type AiJdMetaResult = {
  jdCompanyName: string;
  jdJobRole: string;
  usage: AiJdMetaUsage;
};

export type AiJdMetaProvider = {
  id: AiProviderId;
  run(input: AiJdMetaRequest): Promise<AiJdMetaResult>;
};
