import type { GeneratedResume } from "@johel/resume";

import type { AiProviderId } from "../ai-provider";
import type { AiResumeUsage } from "../ai-resume/types";

export type DraftRefineMode = "instruction" | "experiences";

export type DraftRefineExperienceMaterial = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

export type DraftRefineCompanyScene = {
  id: string;
  alias: string;
  name: string;
  whatCompanyIs: string;
};

export type DraftRefineInput = {
  language: string;
  resume: GeneratedResume;
  mode: DraftRefineMode;
  instruction?: string;
  experiences?: DraftRefineExperienceMaterial[];
  company?: DraftRefineCompanyScene;
};

export type DraftRefineRequest = {
  apiKey: string;
  systemPrompt: string;
  input: DraftRefineInput;
};

export type DraftRefineProviderResult = {
  resume: GeneratedResume;
  usage: AiResumeUsage;
};

export type DraftRefineProvider = {
  id: AiProviderId;
  run(input: DraftRefineRequest): Promise<DraftRefineProviderResult>;
};
