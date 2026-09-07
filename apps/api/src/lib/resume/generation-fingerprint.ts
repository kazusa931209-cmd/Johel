import type { ResumeGenerationInput } from "../ai-resume/types.js";
import { assembleResumeGenerationInput } from "./assemble-input.js";

export function workflowContentFingerprintFromInput(
  input: Pick<ResumeGenerationInput, "profile" | "companies" | "workflow">,
): string {
  return JSON.stringify({
    profile: input.profile,
    companies: input.companies,
    workflow: input.workflow,
  });
}

export async function buildWorkflowGenerationFingerprint(
  userId: string,
  workflowId: string,
): Promise<string> {
  const assembled = await assembleResumeGenerationInput({
    userId,
    workflowId,
    jobDescription: "",
  });
  return workflowContentFingerprintFromInput(assembled);
}
