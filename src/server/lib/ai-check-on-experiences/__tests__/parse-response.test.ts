import { describe, expect, it } from "vitest";
import { parseCheckOnExperiencesResponse } from "../parse-response";

describe("parseCheckOnExperiencesResponse", () => {
  it("parses a valid response with matched ids", () => {
    const parsed = parseCheckOnExperiencesResponse(
      JSON.stringify({
        verdict: "exists_not_linked",
        matchedExperienceIds: ["exp-1"],
        explanation: "A CI/CD card covers this.",
      }),
      true,
    );

    expect(parsed).toEqual({
      verdict: "exists_not_linked",
      matchedExperienceIds: ["exp-1"],
      explanation: "A CI/CD card covers this.",
    });
  });

  it("downgrades exists_and_linked without generation context", () => {
    const parsed = parseCheckOnExperiencesResponse(
      JSON.stringify({
        verdict: "exists_and_linked",
        matchedExperienceIds: ["exp-1"],
        explanation: "Linked card found.",
      }),
      false,
    );

    expect(parsed.verdict).toBe("exists_not_linked");
  });

  it("throws on invalid json", () => {
    expect(() => parseCheckOnExperiencesResponse("not-json", false)).toThrow(
      "OpenAI returned invalid JSON for check on experiences.",
    );
  });
});
