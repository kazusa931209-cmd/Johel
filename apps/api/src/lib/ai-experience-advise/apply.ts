import {
  finalizeExperienceFieldsOnSave,
  validateFormattedMarkdown,
} from "../ai-markdown-format/prompts.js";
import { syncExperienceEmbeddingAfterSave } from "../experience-embedding/sync-after-save.js";
import { prisma } from "../prisma.js";
import { buildExperienceAdviseFingerprint } from "./fingerprint.js";
import type {
  ExperienceAdviseApplyInput,
  ExperienceAdviseApplyResult,
  ExperienceAdviseDraft,
} from "./types.js";

export const EXPERIENCE_ADVISE_FIELD_MAX_LEN = 20_000;

export function finalizeExperienceFieldsForAdvisorApply(input: {
  problem: string;
  actions: string;
  outcome: string;
}): { problem: string; actions: string; outcome: string } {
  const finalized = finalizeExperienceFieldsOnSave({
    problem: input.problem,
    actions: input.actions,
    outcome: input.outcome,
  });

  validateFormattedMarkdown(finalized.problem, EXPERIENCE_ADVISE_FIELD_MAX_LEN);
  validateFormattedMarkdown(finalized.actions, EXPERIENCE_ADVISE_FIELD_MAX_LEN);
  validateFormattedMarkdown(finalized.outcome, EXPERIENCE_ADVISE_FIELD_MAX_LEN);

  return finalized;
}

function persistExperienceFieldsFromAdvisorApply(input: {
  category: string;
  draft: ExperienceAdviseDraft;
  existing?: {
    problem: string;
    actions: string;
    outcome: string;
  };
}): {
  category: string;
  problem: string;
  actions: string;
  outcome: string;
} {
  const problemText = input.draft.problem ?? input.existing?.problem ?? "";
  const actionsText = input.draft.actions ?? input.existing?.actions ?? "";
  const outcomeText = input.draft.outcome ?? input.existing?.outcome ?? "";

  const formatted = finalizeExperienceFieldsForAdvisorApply({
    problem: problemText,
    actions: actionsText,
    outcome: outcomeText,
  });

  return {
    category: input.category,
    ...formatted,
  };
}

export async function applyExperienceAdviseOperations(
  input: ExperienceAdviseApplyInput,
): Promise<ExperienceAdviseApplyResult> {
  const currentFingerprint = await buildExperienceAdviseFingerprint(
    input.userId,
  );
  if (currentFingerprint !== input.workspaceFingerprint) {
    throw new Error(
      "Workspace changed since the suggestion was created. Run the advisor again.",
    );
  }

  const experienceIds: string[] = [];
  const warnings: string[] = [];

  for (const operation of input.operations) {
    if (operation.placement === "create_experience") {
      if (
        !operation.draft.category ||
        !operation.draft.problem ||
        !operation.draft.actions ||
        !operation.draft.outcome
      ) {
        throw new Error(
          "create_experience requires category, problem, actions, and outcome.",
        );
      }

      const formatted = persistExperienceFieldsFromAdvisorApply({
        category: operation.draft.category,
        draft: operation.draft,
      });

      const experience = await prisma.experience.create({
        data: {
          userId: input.userId,
          category: formatted.category,
          problem: formatted.problem,
          actions: formatted.actions,
          outcome: formatted.outcome,
        },
      });
      await syncExperienceEmbeddingAfterSave({
        userId: input.userId,
        experienceId: experience.id,
        category: formatted.category,
        problem: formatted.problem,
        actions: formatted.actions,
        outcome: formatted.outcome,
      });
      experienceIds.push(experience.id);
      continue;
    }

    if (operation.placement === "update_experience") {
      const experienceId = operation.targetExperienceId;
      if (!experienceId) {
        throw new Error("update_experience requires targetExperienceId.");
      }

      const existing = await prisma.experience.findFirst({
        where: { id: experienceId, userId: input.userId },
      });
      if (!existing) {
        throw new Error("Experience was not found.");
      }

      const formatted = persistExperienceFieldsFromAdvisorApply({
        category: operation.draft.category ?? existing.category,
        draft: operation.draft,
        existing: {
          problem: existing.problem,
          actions: existing.actions,
          outcome: existing.outcome,
        },
      });

      await prisma.experience.update({
        where: { id: experienceId },
        data: {
          category: operation.draft.category ?? existing.category,
          problem: formatted.problem,
          actions: formatted.actions,
          outcome: formatted.outcome,
        },
      });

      await syncExperienceEmbeddingAfterSave({
        userId: input.userId,
        experienceId,
        category: operation.draft.category ?? existing.category,
        problem: formatted.problem,
        actions: formatted.actions,
        outcome: formatted.outcome,
      });

      experienceIds.push(experienceId);
    }
  }

  return { experienceIds, warnings };
}
