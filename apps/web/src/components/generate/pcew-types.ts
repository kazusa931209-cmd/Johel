export type WorkflowSelection = {
  workflowId: string;
  workflowName?: string;
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
