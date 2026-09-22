import { describe, expect, it } from "vitest";
import {
  buildExperienceAdviseUserPrompt,
  formatExperiencePoolForAdvise,
} from "../prompts";
import type { ExperienceAdviseGraphExperience } from "../types";

const longProblem = [
  "- **Legacy issue**",
  "  First line of a long problem description that should not all appear in the index.",
  "- **Second bullet**",
  "  More detail only in full STAR blocks.",
].join("\n");

function makeExperience(
  id: string,
  category: string,
  problem = longProblem,
): ExperienceAdviseGraphExperience {
  return {
    id,
    category,
    problem,
    actions: "- **Act**\n  Did something.",
    outcome: "- **Result**\n  Improved.",
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  };
}

describe("formatExperiencePoolForAdvise", () => {
  it("uses full STAR for expanded cards and index for non-expanded cards in create mode", () => {
    const experiences = [
      makeExperience("exp-1", "APIs"),
      makeExperience("exp-2", "Sync"),
    ];
    const pool = formatExperiencePoolForAdvise(
      {
        targetExperienceId: null,
        experiences,
      },
      new Set(["exp-1"]),
      new Set(["exp-2"]),
    );

    expect(pool).toContain("### Expanded candidates (full STAR)");
    expect(pool).toContain("### APIs (id: exp-1)");
    expect(pool).toContain("Actions:\n- **Act**");
    expect(pool).toContain("### Experience index (other pool cards");
    expect(pool).toContain("- exp-2: Sync —");
    expect(pool).not.toContain("- exp-1: APIs —");
    expect(pool).not.toContain("### Sync (id: exp-2)");
  });

  it("uses full STAR for target and index for other cards in edit mode", () => {
    const target = makeExperience("exp-target", "Edit me");
    const other = makeExperience("exp-other", "Other card");

    const pool = formatExperiencePoolForAdvise(
      {
        targetExperienceId: "exp-target",
        experiences: [target, other],
      },
      new Set(["exp-target"]),
      new Set(["exp-other"]),
    );

    expect(pool).toContain("### Edit target and expanded candidates (full STAR)");
    expect(pool).toContain("### Edit me (id: exp-target)");
    expect(pool).toContain("Actions:\n- **Act**");
    expect(pool).toContain("- exp-other: Other card — - **Legacy issue**");
    expect(pool).not.toMatch(
      /### Other card \(id: exp-other\)[\s\S]*Actions:/,
    );
  });

  it("notes truncation when the index omits non-expanded cards", () => {
    const experiences = Array.from({ length: 5 }, (_, index) =>
      makeExperience(`exp-${index + 1}`, `Card ${index + 1}`),
    );

    const pool = formatExperiencePoolForAdvise(
      {
        targetExperienceId: null,
        experiences,
      },
      new Set(["exp-1"]),
      new Set(["exp-2"]),
    );

    expect(pool).toContain(
      "### Experience index (1 of 5 pool cards — id, category, problem summary only; expanded cards above omitted)",
    );
    expect(pool).toContain("- exp-2:");
    expect(pool).not.toContain("- exp-3:");
  });

  it("returns empty pool marker when there are no experiences", () => {
    expect(
      formatExperiencePoolForAdvise(
        {
          targetExperienceId: "missing",
          experiences: [],
        },
        new Set(),
        new Set(),
      ),
    ).toBe("## Experience pool\n\n(none)");
  });
});

describe("buildExperienceAdviseUserPrompt", () => {
  it("includes edit target line and tiered pool when targetExperienceId is set", () => {
    const prompt = buildExperienceAdviseUserPrompt({
      apiKey: "key",
      userFacts: "Added caching layer.",
      expandedIds: new Set(["exp-1"]),
      indexIds: new Set(),
      graph: {
        targetExperienceId: "exp-1",
        experiences: [makeExperience("exp-1", "APIs")],
      },
    });

    expect(prompt).toContain("Edit target experience id: **exp-1**");
    expect(prompt).toContain("Edit target and expanded candidates (full STAR)");
    expect(prompt).toContain("Added caching layer.");
  });

  it("includes create mode line and tiered pool when no target", () => {
    const prompt = buildExperienceAdviseUserPrompt({
      apiKey: "key",
      userFacts: "Built a new service.",
      expandedIds: new Set(["exp-1"]),
      indexIds: new Set(),
      graph: {
        targetExperienceId: null,
        experiences: [makeExperience("exp-1", "APIs")],
      },
    });

    expect(prompt).toContain("Mode: **create**");
    expect(prompt).toContain("### Expanded candidates (full STAR)");
    expect(prompt).toContain("### APIs (id: exp-1)");
    expect(prompt).not.toContain("Edit target and expanded candidates");
  });
});
