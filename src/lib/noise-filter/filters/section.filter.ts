import { footerBoundaryPatterns, sectionHeadings } from "../config";
import type { NoiseFilter, NoiseFilterContext } from "../types";

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return sectionHeadings.some((pattern) => pattern.test(trimmed));
}

function isFooterBoundary(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return footerBoundaryPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * After at least one recognized job section has appeared, drop trailing
 * footer blocks that start at an obvious footer boundary marker.
 */
function filterSections(input: string): string {
  const lines = input.split("\n");
  let sawSection = false;
  let cutAt: number | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (isSectionHeading(line)) {
      sawSection = true;
      continue;
    }
    if (sawSection && isFooterBoundary(line)) {
      cutAt = i;
      break;
    }
  }

  if (cutAt == null) return input.trim();
  return lines.slice(0, cutAt).join("\n").trim();
}

export class SectionFilter implements NoiseFilter {
  name = "section";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterSections(context.text),
    };
  }
}
