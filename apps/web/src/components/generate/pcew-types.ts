export type PcewSelection = {
  profileId: string;
  companyIds: string[];
  experienceIds: string[];
  workflowId: string;
};

export const EMPTY_PCEW_SELECTION: PcewSelection = {
  profileId: "",
  companyIds: [],
  experienceIds: [],
  workflowId: "",
};

export type PcewFieldErrors = {
  profileId?: string;
  companyIds?: string;
  experienceIds?: string;
  workflowId?: string;
};

export function validatePcewSelection(selection: PcewSelection): PcewFieldErrors {
  const errors: PcewFieldErrors = {};
  if (!selection.profileId) {
    errors.profileId = "Select one profile.";
  }
  if (selection.companyIds.length < 1) {
    errors.companyIds = "Select at least one company.";
  }
  if (selection.experienceIds.length < 1) {
    errors.experienceIds = "Select at least one experience.";
  }
  if (!selection.workflowId) {
    errors.workflowId = "Select one workflow.";
  }
  return errors;
}
