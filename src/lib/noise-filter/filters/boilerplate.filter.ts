import { boilerplatePatterns } from "../config";
import type { NoiseFilter, NoiseFilterContext } from "../types";

function filterBoilerplate(input: string): string {
  const lines = input.split("\n");
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return !boilerplatePatterns.some((pattern) => pattern.test(trimmed));
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export class BoilerplateFilter implements NoiseFilter {
  name = "boilerplate";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterBoilerplate(context.text),
    };
  }
}
