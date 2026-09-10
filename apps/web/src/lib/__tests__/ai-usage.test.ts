import { describe, expect, it } from "vitest";
import {
  buildAiUsageGroupKey,
  sortAiUsageGroupsByLatest,
  sortAiUsageItemsByCreatedAt,
} from "../ai-usage";

describe("ai-usage group helpers", () => {
  it("builds generation group key from generationId", () => {
    expect(buildAiUsageGroupKey({ generationId: "gen-1" })).toBe(
      "generation:gen-1",
    );
  });

  it("sorts groups by latestCreatedAt descending", () => {
    const sorted = sortAiUsageGroupsByLatest([
      { latestCreatedAt: "2026-09-08T10:00:00.000Z", id: "old" },
      { latestCreatedAt: "2026-09-09T12:00:00.000Z", id: "new" },
    ] as Array<{ latestCreatedAt: string; id: string }>);
    expect(sorted.map((row) => row.id)).toEqual(["new", "old"]);
  });

  it("sorts usage items by createdAt descending", () => {
    const sorted = sortAiUsageItemsByCreatedAt([
      { createdAt: "2026-09-08T10:00:00.000Z", id: "old" },
      { createdAt: "2026-09-09T12:00:00.000Z", id: "new" },
    ] as Array<{ createdAt: string; id: string }>);
    expect(sorted.map((row) => row.id)).toEqual(["new", "old"]);
  });
});
