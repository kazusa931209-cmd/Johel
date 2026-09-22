import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

export function isExperienceSuggestionActionable(
  displayOperations: ExperienceAdviseDisplayOperation[],
): boolean {
  return displayOperations.length > 0;
}

export function shouldShowInlineExperienceSuggestionReference(
  result: ExperienceAdviseResult | null,
  displayOperations: ExperienceAdviseDisplayOperation[],
): result is ExperienceAdviseResult {
  if (!result) return false;
  return !isExperienceSuggestionActionable(displayOperations);
}
