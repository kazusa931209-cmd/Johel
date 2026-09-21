import { describe, expect, it } from "vitest";
import { selectExpandedExperienceIds } from "../select-expanded-ids";

describe("selectExpandedExperienceIds", () => {
  const experiences = [
    {
      id: "exp-old",
      category: "Legacy APIs",
      problem: "Old NestJS APIs",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "exp-recent",
      category: "Recent work",
      problem: "Recent deployment automation",
      updatedAt: "2026-09-08T00:00:00.000Z",
    },
    {
      id: "exp-match",
      category: "Retail APIs",
      problem: "NestJS retail APIs",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  it("includes target, keyword matches, and recent cards", () => {
    const expanded = selectExpandedExperienceIds({
      userFacts: "Extended NestJS retail APIs",
      experiences,
      targetExperienceId: "exp-target",
      topK: 2,
      recentN: 1,
    });

    expect(expanded.has("exp-target")).toBe(true);
    expect(expanded.has("exp-match")).toBe(true);
    expect(expanded.has("exp-recent")).toBe(true);
  });
});
