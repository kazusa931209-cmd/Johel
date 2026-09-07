import { describe, expect, it } from "vitest";
import {
  parseAuthorAdviseResponse,
  validateAuthorAdviseProposalShape,
} from "../parse-response.js";
import type { AuthorAdviseProposal } from "../types.js";

const baseProposal: AuthorAdviseProposal = {
  placement: "update_experience",
  rationale: "Add microservices wording to the existing API card.",
  questions: [],
  target: {
    workflowId: "wf-1",
    experienceId: "exp-1",
    companyId: "co-1",
  },
  draft: {
    category: null,
    problem: null,
    actions: "- **Microservices**\n  Split payment into services.",
    outcome: null,
    whatCompanyIs: null,
    domainAndStack: null,
    roleContext: null,
    workflowDescription: null,
  },
  link: {
    workflowId: null,
    companyId: null,
    experienceId: null,
  },
  warnings: [],
};

describe("parseAuthorAdviseResponse", () => {
  it("parses valid JSON", () => {
    const result = parseAuthorAdviseResponse(
      JSON.stringify(baseProposal),
      "one",
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.proposal.placement).toBe("update_experience");
      expect(result.proposal.target.experienceId).toBe("exp-1");
    }
  });

  it("parses fenced JSON", () => {
    const result = parseAuthorAdviseResponse(
      "```json\n" + JSON.stringify(baseProposal) + "\n```",
      "one",
    );
    expect(result.success).toBe(true);
  });

  it("rejects link_existing without workflow id in all scope", () => {
    const proposal = {
      ...baseProposal,
      placement: "link_existing",
      target: {
        workflowId: null,
        experienceId: "exp-1",
        companyId: "co-1",
      },
      link: {
        workflowId: null,
        companyId: "co-1",
        experienceId: "exp-1",
      },
    };
    const result = parseAuthorAdviseResponse(JSON.stringify(proposal), "all");
    expect(result.success).toBe(false);
  });

  it("accepts need_more_facts with questions", () => {
    const proposal = {
      ...baseProposal,
      placement: "need_more_facts",
      questions: ["Which company was this at?"],
      draft: {
        category: null,
        problem: null,
        actions: null,
        outcome: null,
        whatCompanyIs: null,
        domainAndStack: null,
        roleContext: null,
        workflowDescription: null,
      },
    };
    const result = parseAuthorAdviseResponse(JSON.stringify(proposal), "all");
    expect(result.success).toBe(true);
  });
});

describe("validateAuthorAdviseProposalShape", () => {
  it("requires draft fields for create_experience", () => {
    const error = validateAuthorAdviseProposalShape(
      {
        ...baseProposal,
        placement: "create_experience",
        draft: {
          category: "APIs",
          problem: null,
          actions: null,
          outcome: null,
          whatCompanyIs: null,
          domainAndStack: null,
          roleContext: null,
          workflowDescription: null,
        },
      },
      "one",
    );
    expect(error).toMatch(/create_experience requires/);
  });
});
