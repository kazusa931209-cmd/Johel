import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

export type ExperienceSuggestionCopyLabels = {
  rationale: string;
  questions: string;
  create: string;
  update: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
  warnings: string;
};

function appendSection(lines: string[], title: string, body: string | null | undefined) {
  const trimmed = body?.trim();
  if (!trimmed) return;
  lines.push(title, trimmed, "");
}

export function formatExperienceSuggestionCopyText(
  result: ExperienceAdviseResult,
  displayOperations: ExperienceAdviseDisplayOperation[],
  labels: ExperienceSuggestionCopyLabels,
): string {
  const lines: string[] = [];

  appendSection(lines, labels.rationale, result.rationale);

  const warnings = result.operations.flatMap((op) => op.warnings);
  if (warnings.length > 0) {
    lines.push(labels.warnings);
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  if (result.questions.length > 0) {
    lines.push(labels.questions);
    for (const question of result.questions) {
      lines.push(`- ${question}`);
    }
    lines.push("");
  }

  for (const operation of displayOperations) {
    const placementLabel =
      operation.placement === "create_experience" ? labels.create : labels.update;
    lines.push(placementLabel);
    appendSection(lines, labels.rationale, operation.rationale);
    appendSection(lines, labels.category, operation.draft.category);
    appendSection(lines, labels.problem, operation.draft.problem);
    appendSection(lines, labels.actions, operation.draft.actions);
    appendSection(lines, labels.outcome, operation.draft.outcome);
    lines.push("---", "");
  }

  return lines.join("\n").trim();
}
