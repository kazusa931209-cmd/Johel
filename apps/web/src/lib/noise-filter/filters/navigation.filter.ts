import {
  navigationExactLabels,
  protectedSectionPhrases,
} from "../config";
import type { NoiseFilter, NoiseFilterContext } from "../types";

const NAV_SET = new Set(
  navigationExactLabels.map((label) => label.toLowerCase()),
);

function isProtected(line: string): boolean {
  const lower = line.toLowerCase();
  return protectedSectionPhrases.some((phrase) => lower.includes(phrase));
}

function filterNavigation(input: string): string {
  const lines = input.split("\n");
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (isProtected(trimmed)) return true;

    const lower = trimmed.toLowerCase();
    if (NAV_SET.has(lower)) return false;

    // Short link-like leftovers that are exact nav labels with trailing punctuation
    const stripped = lower.replace(/[:|•·\-–—]+$/g, "").trim();
    if (stripped !== lower && NAV_SET.has(stripped) && !isProtected(stripped)) {
      return false;
    }

    return true;
  });

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export class NavigationFilter implements NoiseFilter {
  name = "navigation";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterNavigation(context.text),
    };
  }
}
