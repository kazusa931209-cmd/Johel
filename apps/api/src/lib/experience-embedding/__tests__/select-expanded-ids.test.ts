import { describe, expect, it } from "vitest";
import { selectExpandedExperienceIdsWithEmbedding } from "../select-expanded-ids.js";

describe("selectExpandedExperienceIdsWithEmbedding", () => {
  const experiences = [
    {
      id: "exp-a",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "exp-b",
      updatedAt: "2026-09-08T00:00:00.000Z",
    },
    {
      id: "exp-c",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  const embeddingCandidates = [
    { id: "exp-a", vector: [1, 0, 0] },
    { id: "exp-b", vector: [0.2, 0.9, 0] },
    { id: "exp-c", vector: [0.8, 0.2, 0] },
  ];

  it("includes target, top-K by cosine, and recent cards", () => {
    const expanded = selectExpandedExperienceIdsWithEmbedding({
      experiences,
      targetExperienceId: "exp-target",
      poolDepth: "normal",
      queryVector: [1, 0, 0],
      embeddingCandidates,
      recentN: 1,
    });

    expect(expanded.has("exp-target")).toBe(true);
    expect(expanded.has("exp-a")).toBe(true);
    expect(expanded.has("exp-b")).toBe(true);
  });

  it("expands all cards for full pool depth", () => {
    const expanded = selectExpandedExperienceIdsWithEmbedding({
      experiences,
      poolDepth: "full",
      queryVector: [1, 0, 0],
      embeddingCandidates,
    });

    expect(expanded.size).toBe(3);
  });
});
