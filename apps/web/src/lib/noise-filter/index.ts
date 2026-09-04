import { BoilerplateFilter } from "./filters/boilerplate.filter";
import { DuplicateFilter } from "./filters/duplicate.filter";
import { HtmlFilter } from "./filters/html.filter";
import { MarkdownFilter } from "./filters/markdown.filter";
import { NavigationFilter } from "./filters/navigation.filter";
import { NormalizeFilter } from "./filters/normalize.filter";
import { SectionFilter } from "./filters/section.filter";
import { DeJobFilter } from "./plugins/dejob.filter";
import { WalletAddressFilter } from "./plugins/wallet-address.filter";
import { createInitialContext, runPipeline } from "./pipeline";
import type { NoiseFilter, NoiseFilterResult } from "./types";

export type {
  NoiseFilter,
  NoiseFilterContext,
  NoiseFilterDiagnostic,
  NoiseFilterResult,
} from "./types";

/** Core website-agnostic filters only. */
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

/** Default site / artifact plugins appended after core filters. */
export function createDefaultPluginFilters(): NoiseFilter[] {
  return [new WalletAddressFilter(), new DeJobFilter()];
}

/** Core + default plugins + optional extra plugins. */
export function createNoiseFilterPipeline(
  extraFilters: NoiseFilter[] = [],
): NoiseFilter[] {
  return [
    ...createDefaultFilters(),
    ...createDefaultPluginFilters(),
    ...extraFilters,
  ];
}

export function noiseFilter(
  raw: string,
  options?: { filters?: NoiseFilter[] },
): NoiseFilterResult {
  const filters = options?.filters ?? createNoiseFilterPipeline();
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
