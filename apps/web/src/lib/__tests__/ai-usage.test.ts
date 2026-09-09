import { describe, expect, it } from "vitest";
import {
  buildAiUsageGroupKey,
  formatStandaloneGroupLabel,
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
});
