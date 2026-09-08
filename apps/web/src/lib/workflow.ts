export const WORKFLOW_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh-TW", label: "Chinese (Taiwan)" },
  { value: "zh-CN", label: "Chinese (Mainland)" },
  { value: "ko", label: "Korean" },
] as const;

export type WorkflowLanguage = (typeof WORKFLOW_LANGUAGES)[number]["value"];

export type WorkflowCompanyEntry = {
  companyId: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  experienceIds: string[];
};

export type WorkflowDetail = {
  id: string;
  name: string;
  description: string;
  language: WorkflowLanguage | string;
  profileId: string;
  companies: WorkflowCompanyEntry[];
  createdAt: string;
  updatedAt: string;
};

export type WorkflowWritePayload = {
  name: string;
  description: string;
  language: WorkflowLanguage;
  profileId: string;
  companies: WorkflowCompanyEntry[];
};

export type WorkflowEditorFieldErrors = {
  profileId?: string;
  companies?: string;
};

export function formatWorkflowPeriod(startDate: string, endDate: string): string {
  return `${startDate.trim()} – ${endDate.trim()}`;
}

export function validateWorkflowEditorContent(
  input: {
    profileId: string;
    companies: WorkflowCompanyEntry[];
  },
  t: (key: string) => string,
): WorkflowEditorFieldErrors {
  const errors: WorkflowEditorFieldErrors = {};
  if (!input.profileId) {
    errors.profileId = t("validation.profileRequired");
  }
  if (input.companies.length < 1) {
    errors.companies = t("validation.companiesMinOne");
    return errors;
  }
  const invalidEntry = input.companies.some(
    (entry) =>
      !entry.companyId ||
      !entry.startDate.trim() ||
      !entry.endDate.trim() ||
      !entry.roleContext.trim() ||
      entry.experienceIds.length < 1,
  );
  if (invalidEntry) {
    errors.companies = t("validation.companyEntryIncomplete");
  }
  return errors;
}
