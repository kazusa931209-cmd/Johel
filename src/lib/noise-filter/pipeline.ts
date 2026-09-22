import type {
  NoiseFilter,
  NoiseFilterContext,
  NoiseFilterDiagnostic,
} from "./types";

export function createInitialContext(raw: string): NoiseFilterContext {
  const source = raw ?? "";
  return {
    source,
    text: source,
    metadata: {
      originalLength: source.length,
      currentLength: source.length,
    },
    diagnostics: [],
  };
}

export function runPipeline(
  filters: NoiseFilter[],
  context: NoiseFilterContext,
): NoiseFilterContext {
  let current = context;

  for (const filter of filters) {
    const beforeLength = current.text.length;
    const next = filter.apply(current);
    const afterLength = next.text.length;
    const diagnostic: NoiseFilterDiagnostic = {
      filter: filter.name,
      beforeLength,
      afterLength,
      removedLength: Math.max(0, beforeLength - afterLength),
    };

    current = {
      ...next,
      source: current.source,
      metadata: {
        originalLength: current.metadata.originalLength,
        currentLength: afterLength,
      },
      diagnostics: [...current.diagnostics, diagnostic],
    };
  }

  return current;
}
