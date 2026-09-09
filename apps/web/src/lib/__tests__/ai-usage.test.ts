import { describe, expect, it } from "vitest";
import {
  buildAiUsageGroupKey,
  formatStandaloneGroupLabel,
  sortAiUsageGroupsByLatest,
  sortAiUsageItemsByCreatedAt,
} from "../ai-usage";

describe("ai-usage group helpers", () => {
  it("builds generation group key from generationId", () => {
    expect(
      buildAiUsageGroupKey({
        generationId: "gen-1",
        standaloneDate: null,
        generateType: null,
      }),
    ).toBe("generation:gen-1");
  });

  it("builds standalone group key as YYYYMMDD-generateType", () => {
    expect(
      buildAiUsageGroupKey({
        generationId: null,
        standaloneDate: "20260909",
        generateType: "markdownFormat",
      }),
    ).toBe("standalone:20260909-markdownFormat");
  });

  it("falls back to latestCreatedAt when standaloneDate is missing", () => {
    expect(
      buildAiUsageGroupKey({
        generationId: null,
        standaloneDate: null,
        generateType: "markdownFormat",
        latestCreatedAt: "2026-09-09T12:00:00.000Z",
      }),
    ).toBe("standalone:markdownFormat:2026-09-09T12:00:00.000Z");
  });

  it("formats standalone group label with localized generate type", () => {
    expect(
      formatStandaloneGroupLabel("20260909", "markdownFormat", "en"),
    ).toBe("20260909-Markdown Format");
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
