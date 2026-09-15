import { describe, expect, it } from "vitest";
import { parseCheckGapsResponse } from "../parse-response.js";

describe("parseCheckGapsResponse", () => {
  it("parses a valid response", () => {
    const parsed = parseCheckGapsResponse(
      JSON.stringify({
        verdict: "exists_not_linked",
        matchedExperienceIds: ["exp-1"],
        explanation: "A matching card exists.",
      }),
      true,
    );

    expect(parsed).toEqual({
      verdict: "exists_not_linked",
      matchedExperienceIds: ["exp-1"],
      explanation: "A matching card exists.",
    });
  });

  it("downgrades exists_and_linked without generation context", () => {
    const parsed = parseCheckGapsResponse(
      JSON.stringify({
        verdict: "exists_and_linked",
        matchedExperienceIds: ["exp-1"],
        explanation: "Already linked.",
      }),
      false,
    );

    expect(parsed.verdict).toBe("exists_not_linked");
  });

  it("throws on invalid json", () => {
    expect(() => parseCheckGapsResponse("not-json", false)).toThrow(
      "invalid JSON",
    );
  });
});
