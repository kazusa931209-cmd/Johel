export const WORKFLOW_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh-TW", label: "Chinese (Taiwan)" },
  { value: "zh-CN", label: "Chinese (Mainland)" },
  { value: "ko", label: "Korean" },
] as const;

export type WorkflowLanguage = (typeof WORKFLOW_LANGUAGES)[number]["value"];

export type WorkflowDetail = {
  id: string;
  name: string;
  description: string | null;
  language: WorkflowLanguage | string;
  profileId: string;
  companyIds: string[];
  experienceIds: string[];
  used: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowWritePayload = {
  name: string;
  description?: string | null;
  language: WorkflowLanguage;
  profileId: string;
  companyIds: string[];
  experienceIds: string[];
};
