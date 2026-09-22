import type { AiProviderId } from "../ai-provider";
import type { ExperienceAdviseGraph } from "../ai-experience-advise/types";

export type CheckOnExperiencesVerdict =
  | "gap_confirmed"
  | "exists_not_linked"
  | "exists_and_linked";

export type CheckOnExperiencesParsedResponse = {
  verdict: CheckOnExperiencesVerdict;
  matchedExperienceIds: string[];
  explanation: string;
};

export type CheckOnExperiencesRunInput = {
  apiKey: string;
  searchText: string;
  graph: ExperienceAdviseGraph;
  expandedIds: Set<string>;
  indexIds: Set<string>;
  linkedExperienceIds: Set<string> | null;
};

export type CheckOnExperiencesRunResult = {
  verdict: CheckOnExperiencesVerdict;
  matchedExperienceIds: string[];
  markdown: string;
  usage: {
    inputToken: number;
    outputToken: number;
    input: string;
    output: string;
  };
};

export type CheckOnExperiencesProvider = {
  id: AiProviderId;
  run(input: CheckOnExperiencesRunInput): Promise<CheckOnExperiencesRunResult>;
};
