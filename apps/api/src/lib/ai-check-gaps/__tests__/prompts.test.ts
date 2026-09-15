import { describe, expect, it } from "vitest";
import { buildCheckGapsUserPrompt } from "../prompts.js";

const graph = {
  experiences: [
    {
      id: "exp-1",
      category: "API Platform",
      problem: "Slow releases",
      actions: "Built CI/CD",
      outcome: "Faster deploys",
      updatedAt: new Date("2026-01-01"),
    },
  ],
  targetExperienceId: null,
};

describe("buildCheckGapsUserPrompt", () => {
  it("includes linked ids when generation context is present", () => {
    const prompt = buildCheckGapsUserPrompt({
      apiKey: "test",
      gapQuery: "No CI/CD experience mentioned",
      graph,
      expandedIds: new Set(["exp-1"]),
      indexIds: new Set(),
      linkedExperienceIds: new Set(["exp-1"]),
    });

    expect(prompt).toContain("Linked experience ids for this Generate");
    expect(prompt).toContain("exp-1");
    expect(prompt).toContain("No CI/CD experience mentioned");
  });

  it("omits linked ids section without generation context", () => {
    const prompt = buildCheckGapsUserPrompt({
      apiKey: "test",
      gapQuery: "Missing leadership examples",
      graph,
      expandedIds: new Set(["exp-1"]),
      indexIds: new Set(),
      linkedExperienceIds: null,
    });

    expect(prompt).not.toContain("Linked experience ids for this Generate");
    expect(prompt).toContain("Missing leadership examples");
  });
});
