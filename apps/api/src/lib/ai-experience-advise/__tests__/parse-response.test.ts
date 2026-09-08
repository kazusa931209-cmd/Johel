import { describe, expect, it } from "vitest";
import { parseExperienceAdviseResponse } from "../parse-response.js";

const graphIds = new Set(["exp-1"]);

describe("parseExperienceAdviseResponse", () => {
  it("parses create operation", () => {
    const payload = {
      rationale: "New capability card.",
      questions: [],
      operations: [
        {
          placement: "create_experience",
          rationale: "New on-chain sync card.",
          targetExperienceId: null,
          draft: {
            category: "On-chain Sync",
            problem: "- **Nonce**\n  Shared wallet conflicts.",
            actions: "- **Leases**\n  PG-backed send leases.",
            outcome: "- **Reliability**\n  Fewer failures.",
          },
          warnings: [],
        },
      ],
    };
    const result = parseExperienceAdviseResponse(
      JSON.stringify(payload),
      graphIds,
    );
    expect(result.success).toBe(true);
  });

  it("parses need_more_facts with questions", () => {
    const payload = {
      rationale: "Need outcome metrics.",
      questions: ["What improved after the change?"],
      operations: [
        {
          placement: "need_more_facts",
          rationale: "No measurable outcome stated.",
          targetExperienceId: null,
          draft: {
            category: null,
            problem: null,
            actions: null,
            outcome: null,
          },
          warnings: [],
        },
      ],
    };
    const result = parseExperienceAdviseResponse(
      JSON.stringify(payload),
      graphIds,
    );
    expect(result.success).toBe(true);
  });

  it("rejects update without target id", () => {
    const payload = {
      rationale: "Update",
      questions: [],
      operations: [
        {
          placement: "update_experience",
          rationale: "Add Go actions.",
          targetExperienceId: null,
          draft: {
            category: null,
            problem: null,
            actions: "- **Go**\n  Rewrote worker.",
            outcome: null,
          },
          warnings: [],
        },
      ],
    };
    const result = parseExperienceAdviseResponse(
      JSON.stringify(payload),
      graphIds,
    );
    expect(result.success).toBe(false);
  });
});
