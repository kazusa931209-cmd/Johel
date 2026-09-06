export const VERDICT_PROMPT_PLACEHOLDER =
  "Instructions for checking whether a Job Description is suitable.";

export const GENERATE_PROMPT_PLACEHOLDER =
  "Instructions for tailoring and generating a resume from the job and your profile data.";

export const EVALUATE_PROMPT_PLACEHOLDER =
  "Instructions for evaluating a generated resume against a job description from an ATS perspective.";

export const PROMPT_HELPER_REQUEST_MAX = 150;

export function appendPromptHelperText(
  current: string,
  sentence: string,
): string {
  const trimmed = current.trimEnd();
  const block = `## New\n${sentence.trim()}`;
  if (!trimmed) return block;
  return `${trimmed}\n\n${block}`;
}
