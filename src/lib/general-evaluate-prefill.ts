/** Settings General Evaluate prompt + extension for Resume Builder Evaluate prefill. */
export function buildGeneralEvaluateUserPrefill(
  generalEvaluatePrompt: string,
  generalEvaluateExtension: string,
): string {
  const trimmed = generalEvaluatePrompt.trim().replace(/\n{3,}/g, "\n\n");
  const extensionTrimmed = generalEvaluateExtension
    .trim()
    .replace(/\n{3,}/g, "\n\n");
  return extensionTrimmed ? `${trimmed}\n\n${extensionTrimmed}` : trimmed;
}
