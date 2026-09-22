import { describe, expect, it } from "vitest";
import { normalizeAiAssistantOpenOptions } from "@/lib/ai-assistant";

describe("normalizeAiAssistantOpenOptions", () => {
  it("defaults category and clears missing fields", () => {
    expect(normalizeAiAssistantOpenOptions()).toEqual({
      query: "",
      category: "check-on-experiences",
      generationId: null,
    });
  });

  it("prefills query, category, and generationId", () => {
    expect(
      normalizeAiAssistantOpenOptions({
        query: "  Missing cloud experience  ",
        category: "check-on-experiences",
        generationId: "gen-123",
      }),
    ).toEqual({
      query: "Missing cloud experience",
      category: "check-on-experiences",
      generationId: "gen-123",
    });
  });
});
