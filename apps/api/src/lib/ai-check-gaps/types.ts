import type { AiProviderId } from "../ai-provider.js";
import type { ExperienceAdviseGraph } from "../ai-experience-advise/types.js";

export type CheckGapsVerdict =
  | "gap_confirmed"
  | "exists_not_linked"
  | "exists_and_linked";

export type CheckGapsParsedResponse = {
  verdict: CheckGapsVerdict;
  matchedExperienceIds: string[];
  explanation: string;
};

export type CheckGapsRunInput = {
  apiKey: string;
  gapQuery: string;
  graph: ExperienceAdviseGraph;
  expandedIds: Set<string>;
  indexIds: Set<string>;
  linkedExperienceIds: Set<string> | null;
};

export type CheckGapsRunResult = {
  verdict: CheckGapsVerdict;
  matchedExperienceIds: string[];
  markdown: string;
  usage: {
    inputToken: number;
    outputToken: number;
    input: string;
    output: string;
  };
};

export type CheckGapsProvider = {
  id: AiProviderId;
  run(input: CheckGapsRunInput): Promise<CheckGapsRunResult>;
};
