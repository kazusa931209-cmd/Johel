import { describe, expect, it } from "vitest";
import {
  parseExperienceAdviseResponse,
  sanitizeCategoryTitle,
} from "../parse-response.js";

const graphIds = new Set(["exp-1"]);

describe("sanitizeCategoryTitle", () => {
  it("strips capability bullet markdown", () => {
    expect(
      sanitizeCategoryTitle(
        "- **Capability:** AI-powered matching, abuse controls, and tamper-evident data integrity",
      ),
    ).toBe(
      "AI-powered matching, abuse controls, and tamper-evident data integrity",
    );
  });

  it("keeps plain capability titles", () => {
    expect(sanitizeCategoryTitle("On-chain Transaction Sync (Go/Rust)")).toBe(
      "On-chain Transaction Sync (Go/Rust)",
    );
  });
});

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

  it("sanitizes markdown category on create", () => {
    const payload = {
      rationale: "New capability card.",
      questions: [],
      operations: [
        {
          placement: "create_experience",
          rationale: "Matching card.",
          targetExperienceId: null,
          draft: {
            category:
              "- **Capability:** AI-powered matching and abuse controls",
            problem: "- **Fraud**\n  Fake listings.",
            actions: "- **Checks**\n  Added integrity hashes.",
            outcome: "- **Trust**\n  Fewer disputes.",
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
    if (result.success) {
      expect(result.result.operations[0]?.draft.category).toBe(
        "AI-powered matching and abuse controls",
      );
    }
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
