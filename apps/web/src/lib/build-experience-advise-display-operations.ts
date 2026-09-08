import {
  getExperience,
  type ExperienceAdviseApplyOperation,
  type ExperienceAdviseDraft,
  type ExperienceAdviseOperation,
} from "@/lib/api";
import { mergeExperienceFieldUpdate } from "@/lib/merge-experience-field-update";

export type ExperienceAdviseDisplayOperation = {
  placement: "create_experience" | "update_experience";
  targetExperienceId: string | null;
  rationale: string;
  draft: ExperienceAdviseDraft;
  warnings: string[];
};

export async function buildExperienceAdviseDisplayOperations(
  operations: ExperienceAdviseOperation[],
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
      const experienceRes = await getExperience(operation.targetExperienceId);
      const existing = experienceRes.data;
      const delta = operation.draft;

      display.push({
        placement: "update_experience",
        targetExperienceId: operation.targetExperienceId,
        rationale: operation.rationale,
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
