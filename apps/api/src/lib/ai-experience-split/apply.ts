import {
  finalizeExperienceFieldsForAdvisorApply,
} from "../ai-experience-advise/apply.js";
import { buildExperienceAdviseFingerprint } from "../ai-experience-advise/fingerprint.js";
import { archiveExperience, liveExperienceWhere } from "../experience-live.js";
import { syncExperienceEmbeddingAfterSave } from "../experience-embedding/sync-after-save.js";
import { prisma } from "../prisma.js";
import type {
  ExperienceSplitApplyInput,
  ExperienceSplitApplyResult,
} from "./types.js";

function persistExperienceFieldsFromSplitApply(input: {
  category: string;
  draft: ExperienceSplitApplyInput["operations"][number]["draft"];
}): {
  category: string;
  problem: string;
  actions: string;
  outcome: string;
} {
  const formatted = finalizeExperienceFieldsForAdvisorApply({
    problem: input.draft.problem ?? "",
    actions: input.draft.actions ?? "",
    outcome: input.draft.outcome ?? "",
  });

  return {
    category: input.category,
    ...formatted,
  };
}

export async function applyExperienceSplitOperations(
  input: ExperienceSplitApplyInput,
): Promise<ExperienceSplitApplyResult> {
  const currentFingerprint = await buildExperienceAdviseFingerprint(
    input.userId,
  );
  if (currentFingerprint !== input.workspaceFingerprint) {
    throw new Error(
      "Workspace changed since the suggestion was created. Run split again.",
    );
  }

  const source = await prisma.experience.findFirst({
    where: {
      id: input.experienceId,
      ...liveExperienceWhere(input.userId),
    },
  });
  if (!source) {
    throw new Error("Experience was not found.");
  }

  if (input.operations.length < 1) {
    throw new Error("At least one split operation is required.");
  }

  const experienceIds: string[] = [];
  const warnings: string[] = [
    "The source card was archived. Relink the new cards on the Combine step before generating a resume.",
  ];

  for (const operation of input.operations) {
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

    const formatted = persistExperienceFieldsFromSplitApply({
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
  }

  await archiveExperience({
    userId: input.userId,
    experienceId: input.experienceId,
  });

  return {
    experienceIds,
    archivedId: input.experienceId,
    warnings,
  };
}
