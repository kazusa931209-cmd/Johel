import { BoilerplateFilter } from "./filters/boilerplate.filter";
import { DuplicateFilter } from "./filters/duplicate.filter";
import { HtmlFilter } from "./filters/html.filter";
import { MarkdownFilter } from "./filters/markdown.filter";
import { NavigationFilter } from "./filters/navigation.filter";
import { NormalizeFilter } from "./filters/normalize.filter";
import { SectionFilter } from "./filters/section.filter";
import { createInitialContext, runPipeline } from "./pipeline";
import type { NoiseFilter, NoiseFilterResult } from "./types";

export type {
  NoiseFilter,
  NoiseFilterContext,
  NoiseFilterDiagnostic,
  NoiseFilterResult,
} from "./types";

export function createDefaultFilters(): NoiseFilter[] {
  return [
    new NormalizeFilter(),
    new HtmlFilter(),
    new MarkdownFilter(),
    new BoilerplateFilter(),
    new DuplicateFilter(),
    new NavigationFilter(),
    new SectionFilter(),
  ];
}

/** Default pipeline plus optional site-specific plugins appended at the end. */
export function createNoiseFilterPipeline(
  extraFilters: NoiseFilter[] = [],
): NoiseFilter[] {
  return [...createDefaultFilters(), ...extraFilters];
}

export function noiseFilter(
  raw: string,
  options?: { filters?: NoiseFilter[] },
): NoiseFilterResult {
  const filters = options?.filters ?? createDefaultFilters();
  const initial = createInitialContext(raw ?? "");
  const final = runPipeline(filters, initial);
  const originalLength = final.metadata.originalLength;
  const currentLength = final.text.length;
  const reductionRate =
    originalLength === 0
      ? 0
      : (originalLength - currentLength) / originalLength;

  return {
    text: final.text,
    originalLength,
    currentLength,
    reductionRate,
    diagnostics: final.diagnostics,
  };
}
