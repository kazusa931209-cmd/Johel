import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { finalizeExperienceFieldsOnSave } from "../../ai-markdown-format/prompts";

const EMPTY_FINGERPRINT = createHash("sha256").update("").digest("hex");

const formatExperienceFieldsOnSave = vi.fn();

vi.mock("../../ai-markdown-format/format-on-save", () => ({
  formatExperienceFieldsOnSave,
}));

const findMany = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();

const settingFindUnique = vi.fn();

vi.mock("../../prisma", () => ({
  prisma: {
    experience: {
      findMany,
      findFirst,
      create,
      update,
    },
    setting: {
      findUnique: settingFindUnique,
    },
  },
}));

const { applyExperienceAdviseOperations, finalizeExperienceFieldsForAdvisorApply } =
  await import("../apply.js");

describe("finalizeExperienceFieldsForAdvisorApply", () => {
  it("strips code fences and heading artifacts", () => {
    expect(
      finalizeExperienceFieldsForAdvisorApply({
        problem: "```markdown\n# Problem\n\n- **Issue**\n  Broke.\n```",
        actions: "- **Fix**\n  Repaired.",
        outcome: "- **Result**\n  Stable.",
      }),
    ).toEqual({
      problem: "- **Issue**\n  Broke.",
      actions: "- **Fix**\n  Repaired.",
      outcome: "- **Result**\n  Stable.",
    });
  });

  it("throws when a field is empty after finalize", () => {
    expect(() =>
      finalizeExperienceFieldsForAdvisorApply({
        problem: "   ",
        actions: "- **Fix**\n  Repaired.",
        outcome: "- **Result**\n  Stable.",
      }),
    ).toThrow("Markdown conversion returned empty text.");
  });
});

describe("applyExperienceAdviseOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    settingFindUnique.mockResolvedValue(null);
  });

  it("create_experience persists finalized fields without AI markdown format", async () => {
    const draft = {
      category: "On-chain Sync",
      problem: "```\n# Problem\n\n- **Nonce**\n  Conflicts.\n```",
      actions: "- **Leases**\n  PG-backed send leases.",
      outcome: "- **Result**\n  Fewer failures.",
    };
    const expected = finalizeExperienceFieldsOnSave({
      problem: draft.problem,
      actions: draft.actions,
      outcome: draft.outcome,
    });

    create.mockResolvedValue({ id: "exp-new" });

    const result = await applyExperienceAdviseOperations({
      userId: "user-1",
      workspaceFingerprint: EMPTY_FINGERPRINT,
      operations: [
        {
          placement: "create_experience",
          targetExperienceId: null,
          draft,
        },
      ],
    });

    expect(formatExperienceFieldsOnSave).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        category: draft.category,
        problem: expected.problem,
        actions: expected.actions,
        outcome: expected.outcome,
      },
    });
    expect(result.experienceIds).toEqual(["exp-new"]);
  });

  it("update_experience persists merged draft with finalize only", async () => {
    const mergedDraft = {
      category: "Multi-tenant APIs",
      problem:
        "- **Legacy**\n  Old bullets.\n\n- **New**\n  Added detail.",
      actions: "- **Fix**\n  Repaired routing.",
      outcome: "- **Result**\n  Stable throughput.",
    };
    const expected = finalizeExperienceFieldsOnSave({
      problem: mergedDraft.problem,
      actions: mergedDraft.actions,
      outcome: mergedDraft.outcome,
    });

    findFirst.mockResolvedValue({
      id: "exp-1",
      userId: "user-1",
      category: "Multi-tenant APIs",
      problem: "- **Legacy**\n  Old bullets.",
      actions: "- **Fix**\n  Repaired routing.",
      outcome: "- **Result**\n  Stable throughput.",
    });
    update.mockResolvedValue({ id: "exp-1" });

    const result = await applyExperienceAdviseOperations({
      userId: "user-1",
      workspaceFingerprint: EMPTY_FINGERPRINT,
      operations: [
        {
          placement: "update_experience",
          targetExperienceId: "exp-1",
          draft: mergedDraft,
        },
      ],
    });

    expect(formatExperienceFieldsOnSave).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "exp-1" },
      data: {
        category: mergedDraft.category,
        problem: expected.problem,
        actions: expected.actions,
        outcome: expected.outcome,
      },
    });
    expect(result.experienceIds).toEqual(["exp-1"]);
  });
});
