import { describe, expect, it } from "vitest";
import {
  buildLinkedExperienceRevision,
  type ExperienceDetail,
} from "@/lib/experience";

const experiences: ExperienceDetail[] = [
  {
    id: "exp-1",
    category: "Backend",
    problem: "p",
    actions: "a",
    outcome: "o",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "exp-2",
    category: "Frontend",
    problem: "p",
    actions: "a",
    outcome: "o",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

describe("buildLinkedExperienceRevision", () => {
  it("returns empty when nothing is linked", () => {
    expect(buildLinkedExperienceRevision([], experiences)).toBe("");
  });

  it("changes when a linked experience is updated", () => {
    const before = buildLinkedExperienceRevision(["exp-1"], experiences);
    const after = buildLinkedExperienceRevision(["exp-1"], [
      { ...experiences[0], updatedAt: "2026-01-03T00:00:00.000Z" },
      experiences[1],
    ]);
    expect(before).not.toBe(after);
  });

  it("does not change when an unrelated experience is added", () => {
    const before = buildLinkedExperienceRevision(["exp-1"], experiences);
    const after = buildLinkedExperienceRevision(["exp-1"], [
      ...experiences,
      {
        id: "exp-3",
        category: "DevOps",
        problem: "p",
        actions: "a",
        outcome: "o",
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ]);
    expect(before).toBe(after);
  });

  it("changes when a linked experience is removed from the pool", () => {
    const before = buildLinkedExperienceRevision(["exp-1"], experiences);
    const after = buildLinkedExperienceRevision(
      ["exp-1"],
      experiences.filter((item) => item.id !== "exp-1"),
    );
    expect(before).not.toBe(after);
    expect(after).toBe("exp-1:missing");
  });
});
