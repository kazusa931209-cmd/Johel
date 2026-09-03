export const DEFAULT_FILTERING_PROMPT =
  "Keep only Job & Job post company information";

/** Empty-field hint for Filtering Prompt (Job Description Processing step 1). */
export const FILTERING_PROMPT_PLACEHOLDER =
  "Process and filter the Job Description.";

export const WORKFLOW_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh-TW", label: "Chinese (Taiwan)" },
  { value: "zh-CN", label: "Chinese (Mainland)" },
  { value: "ko", label: "Korean" },
] as const;

export type WorkflowLanguage = (typeof WORKFLOW_LANGUAGES)[number]["value"];

export type WorkflowMetadataItem = {
  key: string;
  rulePrompt: string | null;
};

export type WorkflowDetail = {
  id: string;
  name: string;
  description: string | null;
  language: WorkflowLanguage | string;
  filteringPrompt: string;
  metadata: WorkflowMetadataItem[];
  used: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowWritePayload = {
  name: string;
  description?: string | null;
  language: WorkflowLanguage;
  filteringPrompt: string;
  metadata: WorkflowMetadataItem[];
};
