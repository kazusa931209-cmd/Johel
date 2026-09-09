const DEFAULT_MAX_LEN = 200;

export function summarizeExperienceProblem(
  problem: string,
  maxLen = DEFAULT_MAX_LEN,
): string {
  const line = problem
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  const summary = line ?? problem.trim();
  if (summary.length <= maxLen) {
    return summary;
  }
  return summary.slice(0, maxLen);
}
