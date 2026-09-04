import type { NoiseFilter, NoiseFilterContext } from "../types";

function filterDuplicates(input: string): string {
  const lines = input.split("\n");
  const out: string[] = [];
  let prevNonEmpty: string | null = null;
  let blankRun = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      blankRun += 1;
      if (blankRun <= 2) out.push("");
      continue;
    }

    blankRun = 0;
    if (prevNonEmpty !== null && trimmed === prevNonEmpty) {
      continue;
    }
    prevNonEmpty = trimmed;
    out.push(line);
  }

  return out.join("\n").trim();
}

export class DuplicateFilter implements NoiseFilter {
  name = "duplicate";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterDuplicates(context.text),
    };
  }
}
