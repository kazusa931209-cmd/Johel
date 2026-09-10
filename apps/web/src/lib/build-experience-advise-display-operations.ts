import {
  type ExperienceAdviseApplyOperation,
  type ExperienceAdviseDraft,
  type ExperienceAdviseExperienceSnapshot,
  type ExperienceAdviseOperation,
} from "@/lib/api";
import { mergeExperienceFieldUpdate } from "@/lib/merge-experience-field-update";

export type ExperienceAdviseDisplayOperation = {
  placement: "create_experience" | "update_experience";
  targetExperienceId: string | null;
  rationale: string;
  draft: ExperienceAdviseDraft;
  /** Raw AI delta before merge; update preview only. */
  deltaDraft?: ExperienceAdviseDraft;
  /** Snapshot before merge; update preview only. */
  existingDraft?: ExperienceAdviseDraft;
  warnings: string[];
};

export async function buildExperienceAdviseDisplayOperations(
  operations: ExperienceAdviseOperation[],
  experiencesById: Record<string, ExperienceAdviseExperienceSnapshot>,
): Promise<ExperienceAdviseDisplayOperation[]> {
  const actionable = operations.filter(
    (op) => op.placement !== "need_more_facts",
  );

  const display: ExperienceAdviseDisplayOperation[] = [];

  for (const operation of actionable) {
    if (operation.placement === "create_experience") {
      display.push({
        placement: "create_experience",
        targetExperienceId: null,
        rationale: operation.rationale,
        draft: operation.draft,
        warnings: operation.warnings,
      });
      continue;
    }

    if (
      operation.placement === "update_experience" &&
      operation.targetExperienceId
    ) {
      const existing = experiencesById[operation.targetExperienceId];
      const delta = operation.draft;

      display.push({
        placement: "update_experience",
        targetExperienceId: operation.targetExperienceId,
        rationale: operation.rationale,
        existingDraft: existing
          ? {
              category: existing.category,
              problem: existing.problem,
              actions: existing.actions,
              outcome: existing.outcome,
            }
          : undefined,
        deltaDraft: delta,
        draft: {
          category: delta.category ?? existing?.category ?? null,
          problem: existing
            ? mergeExperienceFieldUpdate(existing.problem, delta.problem)
            : delta.problem,
          actions: existing
            ? mergeExperienceFieldUpdate(existing.actions, delta.actions)
            : delta.actions,
          outcome: existing
            ? mergeExperienceFieldUpdate(existing.outcome, delta.outcome)
            : delta.outcome,
        },
        warnings: operation.warnings,
      });
    }
  }

  return display;
}

export function toExperienceAdviseApplyOperations(
  operations: ExperienceAdviseDisplayOperation[],
): ExperienceAdviseApplyOperation[] {
  return operations.map((operation) => ({
    placement: operation.placement,
    targetExperienceId: operation.targetExperienceId,
    draft: operation.draft,
  }));
}
