import { z } from "zod";
import {
  sanitizeCategoryTitle,
} from "../ai-experience-advise/parse-response.js";
import type { ExperienceAdviseDraft } from "../ai-experience-advise/types.js";
import type { ExperienceSplitOperation, ExperienceSplitResult } from "./types.js";

const nullableString = z.union([z.string(), z.null()]).optional();

const draftSchema = z.object({
  category: nullableString,
  problem: nullableString,
  actions: nullableString,
  outcome: nullableString,
});

const operationSchema = z.object({
  placement: z.literal("create_experience"),
  rationale: z.string().trim().min(1),
  draft: draftSchema,
  warnings: z.array(z.string()).default([]),
});

const responseSchema = z.object({
  rationale: z.string().trim().min(1),
  questions: z.array(z.string()).default([]),
  operations: z.array(operationSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

function normalizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDraft(
  draft: z.infer<typeof draftSchema>,
): ExperienceAdviseDraft {
  const category = normalizeNullable(draft.category ?? null);
  return {
    category: category ? sanitizeCategoryTitle(category) : null,
    problem: normalizeNullable(draft.problem ?? null),
    actions: normalizeNullable(draft.actions ?? null),
    outcome: normalizeNullable(draft.outcome ?? null),
  };
}

export function validateExperienceSplitOperation(
  operation: ExperienceSplitOperation,
): string | null {
  const draft = operation.draft;
  if (!draft.category || !draft.problem || !draft.actions || !draft.outcome) {
    return "create_experience requires draft category, problem, actions, and outcome.";
  }
  return null;
}

export function validateExperienceSplitResult(
  result: ExperienceSplitResult,
): string | null {
  if (result.operations.length === 0) {
    if (result.questions.length < 1) {
      return "When no split operations are returned, at least one question is required.";
    }
    return null;
  }

  for (const operation of result.operations) {
    const error = validateExperienceSplitOperation(operation);
    if (error) return error;
  }

  return null;
}

export function parseExperienceSplitResponse(raw: string):
  | { success: true; result: ExperienceSplitResult }
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
      error: "AI response did not match the required Experience split schema.",
    };
  }

  const result: ExperienceSplitResult = {
    rationale: parsed.data.rationale,
    questions: parsed.data.questions,
    warnings: parsed.data.warnings,
    operations: parsed.data.operations.map((operation) => ({
      placement: operation.placement,
      rationale: operation.rationale,
      draft: normalizeDraft(operation.draft),
      warnings: operation.warnings,
    })),
  };

  const shapeError = validateExperienceSplitResult(result);
  if (shapeError) {
    return { success: false, error: shapeError };
  }

  return { success: true, result };
}
