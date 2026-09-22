import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const EMPTY_FINGERPRINT = createHash("sha256").update("").digest("hex");

const findMany = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteMany = vi.fn();
const transaction = vi.fn();

const settingFindUnique = vi.fn();
const archiveExperience = vi.fn();
const syncExperienceEmbeddingAfterSave = vi.fn();

vi.mock("../../prisma", () => ({
  prisma: {
    experience: {
      findMany,
      findFirst,
      create,
      update,
    },
    experienceEmbedding: {
      deleteMany,
    },
    $transaction: transaction,
    setting: {
      findUnique: settingFindUnique,
    },
  },
}));

vi.mock("../../experience-live", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../experience-live")>();
  return {
    ...actual,
    archiveExperience,
  };
});

vi.mock("../../experience-embedding/sync-after-save", () => ({
  syncExperienceEmbeddingAfterSave,
}));

const { applyExperienceSplitOperations } = await import("../apply.js");

describe("applyExperienceSplitOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    settingFindUnique.mockResolvedValue(null);
    findFirst.mockResolvedValue({
      id: "exp-source",
      userId: "user-1",
      category: "Mixed",
      problem: "- **A**\n  a",
      actions: "- **B**\n  b",
      outcome: "- **C**\n  c",
      deletedAt: null,
    });
    create.mockResolvedValue({ id: "exp-new-1" });
    archiveExperience.mockResolvedValue(undefined);
    syncExperienceEmbeddingAfterSave.mockResolvedValue(undefined);
  });

  it("creates live cards and archives the source", async () => {
    const result = await applyExperienceSplitOperations({
      userId: "user-1",
      experienceId: "exp-source",
      workspaceFingerprint: EMPTY_FINGERPRINT,
      operations: [
        {
          placement: "create_experience",
          draft: {
            category: "Platform",
            problem: "- **Scale**\n  Cluster grew.",
            actions: "- **Tune**\n  Adjusted limits.",
            outcome: "- **Stable**\n  Fewer incidents.",
          },
        },
      ],
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(archiveExperience).toHaveBeenCalledWith({
      userId: "user-1",
      experienceId: "exp-source",
    });
    expect(result.experienceIds).toEqual(["exp-new-1"]);
    expect(result.archivedId).toBe("exp-source");
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
