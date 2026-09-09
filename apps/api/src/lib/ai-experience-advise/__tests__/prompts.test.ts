import { describe, expect, it } from "vitest";
import {
  buildExperienceAdviseUserPrompt,
  formatExperiencePoolForAdvise,
} from "../prompts.js";
import type { ExperienceAdviseGraphExperience } from "../types.js";

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
  };
}

describe("formatExperiencePoolForAdvise", () => {
  it("uses full STAR blocks for every card in create mode", () => {
    const pool = formatExperiencePoolForAdvise({
      targetExperienceId: null,
      experiences: [
        makeExperience("exp-1", "APIs"),
        makeExperience("exp-2", "Sync"),
      ],
    });

    expect(pool).toContain("### APIs (id: exp-1)");
    expect(pool).toContain("Actions:\n- **Act**");
    expect(pool).toContain("### Sync (id: exp-2)");
    expect(pool).not.toContain("index —");
  });

  it("uses full STAR for target and index lines for others in edit mode", () => {
    const target = makeExperience("exp-target", "Edit me");
    const other = makeExperience("exp-other", "Other card");

    const pool = formatExperiencePoolForAdvise({
      targetExperienceId: "exp-target",
      experiences: [target, other],
    });

    expect(pool).toContain("### Edit target (full STAR)");
    expect(pool).toContain("### Edit me (id: exp-target)");
    expect(pool).toContain("Actions:\n- **Act**");
    expect(pool).toContain("### Other experiences (index");
    expect(pool).toContain("- exp-other: Other card — - **Legacy issue**");
    expect(pool).not.toMatch(
      /### Other card \(id: exp-other\)[\s\S]*Actions:/,
    );
  });

  it("returns empty pool marker when there are no experiences", () => {
    expect(
      formatExperiencePoolForAdvise({
        targetExperienceId: "missing",
        experiences: [],
      }),
    ).toBe("## Experience pool\n\n(none)");
  });
});

describe("buildExperienceAdviseUserPrompt", () => {
  it("includes edit target line and tiered pool when targetExperienceId is set", () => {
    const prompt = buildExperienceAdviseUserPrompt({
      apiKey: "key",
      userFacts: "Added caching layer.",
      graph: {
        targetExperienceId: "exp-1",
        experiences: [makeExperience("exp-1", "APIs")],
      },
    });

    expect(prompt).toContain("Edit target experience id: **exp-1**");
    expect(prompt).toContain("### Edit target (full STAR)");
    expect(prompt).toContain("Added caching layer.");
  });

  it("includes create mode line and full pool when no target", () => {
    const prompt = buildExperienceAdviseUserPrompt({
      apiKey: "key",
      userFacts: "Built a new service.",
      graph: {
        targetExperienceId: null,
        experiences: [makeExperience("exp-1", "APIs")],
      },
    });

    expect(prompt).toContain("Mode: **create**");
    expect(prompt).toContain("### APIs (id: exp-1)");
    expect(prompt).not.toContain("Edit target (full STAR)");
  });
});
