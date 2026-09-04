export type PcewContentSelection = {
  profileId: string;
  companyIds: string[];
  experienceIds: string[];
};

export const EMPTY_PCEW_CONTENT_SELECTION: PcewContentSelection = {
  profileId: "",
  companyIds: [],
  experienceIds: [],
};

export type PcewContentFieldErrors = {
  profileId?: string;
  companyIds?: string;
  experienceIds?: string;
};

export function validatePcewContentSelection(
  selection: PcewContentSelection,
): PcewContentFieldErrors {
  const errors: PcewContentFieldErrors = {};
  if (!selection.profileId) {
    errors.profileId = "Select one profile.";
  }
  if (selection.companyIds.length < 1) {
    errors.companyIds = "Select at least one company.";
  }
  if (selection.experienceIds.length < 1) {
    errors.experienceIds = "Select at least one experience.";
  }
  return errors;
}

export type WorkflowSelection = {
  workflowId: string;
};

export const EMPTY_WORKFLOW_SELECTION: WorkflowSelection = {
  workflowId: "",
};

export type WorkflowFieldErrors = {
  workflowId?: string;
};

export function validateWorkflowSelection(
  selection: WorkflowSelection,
): WorkflowFieldErrors {
  const errors: WorkflowFieldErrors = {};
  if (!selection.workflowId) {
    errors.workflowId = "Select one workflow.";
  }
  return errors;
}
