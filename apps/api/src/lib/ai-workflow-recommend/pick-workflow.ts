import type { WorkflowRecommendMatch } from "./types.js";

export function pickRecommendedWorkflow(
  matches: WorkflowRecommendMatch[],
  threshold: number,
): { workflowId: string | null; score: number | null } {
  if (matches.length === 0) {
    return { workflowId: null, score: null };
  }

  const best = matches.reduce((current, item) =>
    item.score > current.score ? item : current,
  );

  if (best.score < threshold) {
    return { workflowId: null, score: best.score };
  }

  return { workflowId: best.workflowId, score: best.score };
}
