import { describe, expect, it } from "vitest";
import { selectIndexExperienceIdsForAdvise } from "../select-index-ids.js";

function makeExperiences(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `exp-${index + 1}`,
  }));
}

describe("selectIndexExperienceIdsForAdvise", () => {
  it("returns empty index when all cards are expanded on full depth", () => {
    const experiences = makeExperiences(3);
    const expandedIds = new Set(experiences.map((item) => item.id));

    const result = selectIndexExperienceIdsForAdvise({
      experiences,
      expandedIds,
      poolDepth: "full",
      embeddingRankedIds: experiences.map((item) => item.id),
    });

    expect(result.indexIds.size).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("indexes every non-expanded card when the pool is small", () => {
    const experiences = makeExperiences(5);
    const expandedIds = new Set(["exp-1"]);

    const result = selectIndexExperienceIdsForAdvise({
      experiences,
      expandedIds,
      poolDepth: "normal",
      embeddingRankedIds: experiences.map((item) => item.id),
    });

    expect(result.indexIds).toEqual(
      new Set(["exp-2", "exp-3", "exp-4", "exp-5"]),
    );
    expect(result.truncated).toBe(false);
  });

  it("truncates the index on large pools using embedding rank", () => {
    const experiences = makeExperiences(30);
    const expandedIds = new Set(["exp-1"]);
    const embeddingRankedIds = experiences
      .map((item) => item.id)
      .filter((id) => id !== "exp-1");

    const result = selectIndexExperienceIdsForAdvise({
      experiences,
      expandedIds,
      poolDepth: "compact",
      embeddingRankedIds,
    });

    expect(result.indexIds.size).toBe(20);
    expect(result.truncated).toBe(true);
    expect(result.indexIds.has("exp-1")).toBe(false);
    expect(result.indexIds.has("exp-2")).toBe(true);
  });

  it("never includes expanded cards in the index", () => {
    const experiences = makeExperiences(25);
    const expandedIds = new Set(["exp-2", "exp-3"]);

    const result = selectIndexExperienceIdsForAdvise({
      experiences,
      expandedIds,
      poolDepth: "normal",
      embeddingRankedIds: experiences.map((item) => item.id),
    });

    expect(result.indexIds.has("exp-2")).toBe(false);
    expect(result.indexIds.has("exp-3")).toBe(false);
  });
});
