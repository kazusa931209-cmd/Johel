import { describe, expect, it } from "vitest";
import { parseExperienceSplitResponse } from "../parse-response";

describe("parseExperienceSplitResponse", () => {
  it("parses create_experience operations", () => {
    const parsed = parseExperienceSplitResponse(
      JSON.stringify({
        rationale: "Split mixed infra and AI stories.",
        questions: [],
        warnings: [],
        operations: [
          {
            placement: "create_experience",
            rationale: "Platform card",
            draft: {
              category: "Kubernetes Platform",
              problem: "- **Scale**\n  Cluster grew.",
              actions: "- **Tune**\n  Adjusted limits.",
              outcome: "- **Stable**\n  Fewer incidents.",
            },
            warnings: [],
          },
        ],
      }),
    );

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.result.operations).toHaveLength(1);
      expect(parsed.result.operations[0]?.draft.category).toBe(
        "Kubernetes Platform",
      );
    }
  });

  it("requires questions when no operations", () => {
    const parsed = parseExperienceSplitResponse(
      JSON.stringify({
        rationale: "Already focused.",
        questions: [],
        warnings: [],
        operations: [],
      }),
    );

    expect(parsed.success).toBe(false);
  });
});
