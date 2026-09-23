import { describe, expect, it } from "vitest";
import { buildGeneralEvaluateUserPrefill } from "../general-evaluate-prefill";

describe("buildGeneralEvaluateUserPrefill", () => {
  it("joins prompt and extension with a blank line", () => {
    expect(
      buildGeneralEvaluateUserPrefill("Base prompt", "Extension block"),
    ).toBe("Base prompt\n\nExtension block");
  });

  it("returns prompt only when extension is empty", () => {
    expect(buildGeneralEvaluateUserPrefill("Base only", "  ")).toBe("Base only");
  });
});
