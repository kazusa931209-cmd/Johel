import { z } from "zod";
import type {
  ExperienceAdviseDraft,
  ExperienceAdviseOperation,
  ExperienceAdviseResult,
} from "./types.js";

const placementSchema = z.enum([
  "create_experience",
  "update_experience",
  "need_more_facts",
]);

const nullableString = z.union([z.string(), z.null()]).optional();

const draftSchema = z.object({
  category: nullableString,
  problem: nullableString,
  actions: nullableString,
  outcome: nullableString,
});

const operationSchema = z.object({
  placement: placementSchema,
  rationale: z.string().trim().min(1),
  targetExperienceId: nullableString,
  draft: draftSchema.default({
    category: null,
    problem: null,
    actions: null,
    outcome: null,
  }),
  warnings: z.array(z.string()).default([]),
});

const responseSchema = z.object({
  rationale: z.string().trim().min(1),
  questions: z.array(z.string()).default([]),
  operations: z.array(operationSchema).default([]),
});

function normalizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDraft(
  draft: z.infer<typeof draftSchema>,
): ExperienceAdviseDraft {
  return {
    category: normalizeNullable(draft.category ?? null),
    problem: normalizeNullable(draft.problem ?? null),
    actions: normalizeNullable(draft.actions ?? null),
    outcome: normalizeNullable(draft.outcome ?? null),
  };
}

export function validateExperienceAdviseOperation(
  operation: ExperienceAdviseOperation,
  graphExperienceIds: Set<string>,
): string | null {
  if (operation.placement === "need_more_facts") {
    return null;
  }

  if (operation.placement === "create_experience") {
    const draft = operation.draft;
    if (!draft.category || !draft.problem || !draft.actions || !draft.outcome) {
      return "create_experience requires draft category, problem, actions, and outcome.";
    }
    return null;
  }

  if (operation.placement === "update_experience") {
    if (!operation.targetExperienceId) {
      return "update_experience requires targetExperienceId.";
    }
    if (!graphExperienceIds.has(operation.targetExperienceId)) {
      return "update_experience targetExperienceId is not in the experience pool.";
    }
    const draft = operation.draft;
    if (
      !draft.category &&
      !draft.problem &&
      !draft.actions &&
      !draft.outcome
    ) {
      return "update_experience requires at least one draft field.";
    }
    return null;
  }

  return null;
}

export function validateExperienceAdviseResult(
  result: ExperienceAdviseResult,
  graphExperienceIds: Set<string>,
): string | null {
  const actionable = result.operations.filter(
    (op) => op.placement !== "need_more_facts",
  );

  if (actionable.length === 0) {
    if (result.questions.length < 1) {
      return "When no operations are actionable, at least one question is required.";
    }
    return null;
  }

  for (const operation of actionable) {
    const error = validateExperienceAdviseOperation(operation, graphExperienceIds);
    if (error) return error;
  }

  return null;
}

export function parseExperienceAdviseResponse(
  raw: string,
  graphExperienceIds: Set<string>,
):
  | { success: true; result: ExperienceAdviseResult }
  | { success: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: "AI returned an empty response." };
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "AI response was not valid JSON." };
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      success: false,
      error: "AI response did not match the required Experience advisor schema.",
    };
  }

  const result: ExperienceAdviseResult = {
    rationale: parsed.data.rationale,
    questions: parsed.data.questions,
    operations: parsed.data.operations.map((operation) => ({
      placement: operation.placement,
      rationale: operation.rationale,
      targetExperienceId: normalizeNullable(
        operation.targetExperienceId ?? null,
      ),
      draft: normalizeDraft(operation.draft),
      warnings: operation.warnings,
    })),
  };

  const shapeError = validateExperienceAdviseResult(result, graphExperienceIds);
  if (shapeError) {
    return { success: false, error: shapeError };
  }

  return { success: true, result };
}
