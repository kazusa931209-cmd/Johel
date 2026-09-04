import { noiseFilter } from "./noise-filter";

export const JOB_TEXT_MAX = 10_000;
export const JOB_ROLLBACK_MAX = 3;

/** Client-side noise cleanup for Job Description text (no AI). */
export function applyNoiseFilter(input: string): string {
  return noiseFilter(input).text;
}

export {
  noiseFilter,
  createNoiseFilterPipeline,
  createDefaultFilters,
} from "./noise-filter";
export type {
  NoiseFilter,
  NoiseFilterContext,
  NoiseFilterDiagnostic,
  NoiseFilterResult,
} from "./noise-filter";
