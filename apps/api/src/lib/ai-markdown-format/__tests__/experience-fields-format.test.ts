import { describe, expect, it } from "vitest";
import {
  areExperienceFieldsUnchanged,
  finalizeExperienceFieldsOnSave,
  parseExperienceFieldsFormatResponse,
} from "../prompts.js";

describe("areExperienceFieldsUnchanged", () => {
  it("returns true when all fields match stored values", () => {
    expect(
      areExperienceFieldsUnchanged({
        problem: "problem",
        actions: "actions",
        outcome: "outcome",
        stored: {
          problem: "problem",
          actions: " actions ",
          outcome: "outcome",
        },
      }),
    ).toBe(true);
  });

  it("returns false when any field differs", () => {
    expect(
      areExperienceFieldsUnchanged({
        problem: "new",
        actions: "actions",
        outcome: "outcome",
        stored: {
          problem: "problem",
          actions: "actions",
          outcome: "outcome",
        },
      }),
    ).toBe(false);
  });
});

describe("parseExperienceFieldsFormatResponse", () => {
  it("parses JSON and finalizes each STAR field", () => {
    const raw = JSON.stringify({
      problem: "- **Issue**\n  Something broke.",
      actions: "- **Fix**\n  Repaired it.",
      outcome: "- **Result**\n  Stable again.",
    });

    expect(parseExperienceFieldsFormatResponse(raw, 20_000)).toEqual({
      problem: "- **Issue**\n  Something broke.",
      actions: "- **Fix**\n  Repaired it.",
      outcome: "- **Result**\n  Stable again.",
    });
  });

  it("strips structured-list artifacts from each field", () => {
    const raw = JSON.stringify({
      problem: "# Problem\n\n- **Issue**\n  Something broke.",
      actions: "- **Fix**\n  Repaired it.",
      outcome: "- **Result**\n  Stable again.",
    });

    expect(parseExperienceFieldsFormatResponse(raw, 20_000).problem).toBe(
      "- **Issue**\n  Something broke.",
    );
  });

  it("accepts fenced JSON", () => {
    const raw = `\`\`\`json
${JSON.stringify({
  problem: "- **Issue**\n  Something broke.",
  actions: "- **Fix**\n  Repaired it.",
  outcome: "- **Result**\n  Stable again.",
})}
\`\`\``;

    expect(parseExperienceFieldsFormatResponse(raw, 20_000).actions).toBe(
      "- **Fix**\n  Repaired it.",
    );
  });
});

describe("finalizeExperienceFieldsOnSave", () => {
  it("finalizes unchanged submitted values without AI", () => {
    expect(
      finalizeExperienceFieldsOnSave({
        problem: "  - **Issue**\n  Something broke.  ",
        actions: "- **Fix**\n  Repaired it.",
        outcome: "- **Result**\n  Stable again.",
      }),
    ).toEqual({
      problem: "- **Issue**\n  Something broke.",
      actions: "- **Fix**\n  Repaired it.",
      outcome: "- **Result**\n  Stable again.",
    });
  });
});
