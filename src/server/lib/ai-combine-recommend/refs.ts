export type RefMaps = {
  experienceRefToId: Map<string, string>;
  companyRefToId: Map<string, string>;
  experienceRefWidth: number;
  companyRefWidth: number;
};

function refWidth(count: number): number {
  return Math.max(2, String(count).length);
}

function formatRef(prefix: string, index: number, width: number): string {
  return `${prefix}${String(index).padStart(width, "0")}`;
}

export function buildCombineRecommendRefMaps(input: {
  experienceIds: string[];
  companyIds: string[];
}): RefMaps {
  const experienceRefWidth = refWidth(input.experienceIds.length);
  const companyRefWidth = refWidth(input.companyIds.length);

  const experienceRefToId = new Map<string, string>();
  input.experienceIds.forEach((id, index) => {
    experienceRefToId.set(
      formatRef("E", index + 1, experienceRefWidth),
      id,
    );
  });

  const companyRefToId = new Map<string, string>();
  input.companyIds.forEach((id, index) => {
    companyRefToId.set(formatRef("C", index + 1, companyRefWidth), id);
  });

  return {
    experienceRefToId,
    companyRefToId,
    experienceRefWidth,
    companyRefWidth,
  };
}

export function resolveExperienceRef(
  raw: string,
  refToId: Map<string, string>,
  width: number,
): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (refToId.has(trimmed)) {
    return refToId.get(trimmed) ?? null;
  }

  const match = trimmed.match(/^E(\d+)$/);
  if (!match) {
    return null;
  }

  const canonical = formatRef("E", Number.parseInt(match[1], 10), width);
  return refToId.get(canonical) ?? null;
}

export function resolveCompanyRef(
  raw: string,
  refToId: Map<string, string>,
  width: number,
): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (refToId.has(trimmed)) {
    return refToId.get(trimmed) ?? null;
  }

  const match = trimmed.match(/^C(\d+)$/);
  if (!match) {
    return null;
  }

  const canonical = formatRef("C", Number.parseInt(match[1], 10), width);
  return refToId.get(canonical) ?? null;
}

export function dedupePreservingOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export type RefLabelLookup = {
  companyNameById: Map<string, string>;
  experienceCategoryById: Map<string, string>;
};

export function humanizeRefTokensInText(
  text: string,
  refMaps: RefMaps,
  labels: RefLabelLookup,
): string {
  return text.replace(/\b([CEce])(\d+)\b/g, (match, prefix, digits) => {
    const raw = `${prefix.toUpperCase()}${digits}`;
    if (prefix.toUpperCase() === "C") {
      const companyId = resolveCompanyRef(
        raw,
        refMaps.companyRefToId,
        refMaps.companyRefWidth,
      );
      if (companyId) {
        return labels.companyNameById.get(companyId) ?? match;
      }
      return match;
    }

    const experienceId = resolveExperienceRef(
      raw,
      refMaps.experienceRefToId,
      refMaps.experienceRefWidth,
    );
    if (experienceId) {
      return labels.experienceCategoryById.get(experienceId) ?? match;
    }
    return match;
  });
}

export function humanizeRefTokensInWarnings(
  warnings: string[],
  refMaps: RefMaps,
  labels: RefLabelLookup,
): string[] {
  return warnings.map((warning) =>
    humanizeRefTokensInText(warning, refMaps, labels),
  );
}
