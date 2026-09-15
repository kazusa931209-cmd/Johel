import type { ExperienceSplitOperation, ExperienceSplitResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

export function buildExperienceSplitDisplayOperations(
  operations: ExperienceSplitOperation[],
): ExperienceAdviseDisplayOperation[] {
  return operations.map((operation) => ({
    placement: "create_experience",
    targetExperienceId: null,
    rationale: operation.rationale,
    draft: operation.draft,
    warnings: operation.warnings,
  }));
}

export function toExperienceSplitApplyOperations(
  operations: ExperienceAdviseDisplayOperation[],
): Array<{ placement: "create_experience"; draft: ExperienceSplitOperation["draft"] }> {
  return operations.map((operation) => ({
    placement: "create_experience" as const,
    draft: operation.draft,
  }));
}

export function mapSplitResultToAdviseShape(
  result: ExperienceSplitResult,
): {
  rationale: string;
  questions: string[];
  operations: Array<{
    placement: "create_experience";
    rationale: string;
    targetExperienceId: null;
    draft: ExperienceSplitOperation["draft"];
    warnings: string[];
  }>;
} {
  return {
    rationale: result.rationale,
    questions: result.questions,
    operations: result.operations.map((operation) => ({
      placement: "create_experience",
      rationale: operation.rationale,
      targetExperienceId: null,
      draft: operation.draft,
      warnings: operation.warnings,
    })),
  };
}
