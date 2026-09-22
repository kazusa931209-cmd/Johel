import { dejobLinePatterns } from "./dejob.config";
import type { NoiseFilter, NoiseFilterContext } from "../types";

function filterDeJobChrome(input: string): string {
  const lines = input.split("\n");
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return !dejobLinePatterns.some((pattern) => pattern.test(trimmed));
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export class DeJobFilter implements NoiseFilter {
  name = "dejob";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterDeJobChrome(context.text),
    };
  }
}
