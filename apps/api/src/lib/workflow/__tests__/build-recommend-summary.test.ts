import { describe, expect, it } from "vitest";
import {
  buildWorkflowListFingerprint,
  buildWorkflowRecommendSummary,
  type WorkflowRecommendWorkflowRow,
} from "../build-recommend-summary.js";
import type { WorkflowRecommendSummary } from "../../ai-workflow-recommend/types.js";

function makeWorkflow(
  overrides: Partial<WorkflowRecommendWorkflowRow> = {},
): WorkflowRecommendWorkflowRow {
  return {
    id: "wf-1",
    name: "Backend",
    description: "Backend roles",
    language: "en",
    profile: { firstName: "Jane", lastName: "Doe" },
    companies: [],
    ...overrides,
  };
}

describe("buildWorkflowRecommendSummary", () => {
  it("builds flat experiences and ordered company experienceIds", () => {
    const result = buildWorkflowRecommendSummary(
      makeWorkflow({
        companies: [
          {
            startDate: "2020",
            endDate: "2023",
            company: { name: "Acme" },
            experiences: [
              {
                experienceId: "exp-a",
                experience: {
                  id: "exp-a",
                  category: "Backend",
                  description: "Built APIs",
                },
              },
              {
                experienceId: "exp-b",
                experience: {
                  id: "exp-b",
                  category: "Leadership",
                  description: "Led a team",
                },
              },
            ],
          },
        ],
      }),
    );

    expect(result.experiences).toEqual([
      {
        id: "exp-a",
        category: "Backend",
        description: "Built APIs",
      },
      {
        id: "exp-b",
        category: "Leadership",
        description: "Led a team",
      },
    ]);
    expect(result.companies).toEqual([
      {
        name: "Acme",
        startDate: "2020",
        endDate: "2023",
        experienceIds: ["exp-a", "exp-b"],
      },
    ]);
  });

  it("deduplicates shared experiences across companies", () => {
    const shared = {
      id: "exp-a",
      category: "Backend",
      description: "Built APIs",
    };

    const result = buildWorkflowRecommendSummary(
      makeWorkflow({
        companies: [
          {
            startDate: "2020",
            endDate: "2022",
            company: { name: "Acme" },
            experiences: [{ experienceId: "exp-a", experience: shared }],
          },
          {
            startDate: "2022",
            endDate: "2024",
            company: { name: "Beta" },
            experiences: [
              { experienceId: "exp-a", experience: shared },
              {
                experienceId: "exp-c",
                experience: {
                  id: "exp-c",
                  category: "DevOps",
                  description: "CI/CD pipelines",
                },
              },
            ],
          },
        ],
      }),
    );

    expect(result.experiences).toHaveLength(2);
    expect(result.experiences.map((item) => item.id)).toEqual(["exp-a", "exp-c"]);
    expect(result.companies[0]?.experienceIds).toEqual(["exp-a"]);
    expect(result.companies[1]?.experienceIds).toEqual(["exp-a", "exp-c"]);
  });
});

describe("buildWorkflowListFingerprint", () => {
  const baseSummary: WorkflowRecommendSummary = {
    id: "wf-1",
    name: "Backend",
    description: null,
    language: "en",
    profileName: "Jane Doe",
    experiences: [
      {
        id: "exp-a",
        category: "Backend",
        description: "Built APIs",
      },
    ],
    companies: [
      {
        name: "Acme",
        startDate: "2020",
        endDate: "2023",
        experienceIds: ["exp-a"],
      },
    ],
  };

  it("changes when experience description changes", () => {
    const before = buildWorkflowListFingerprint([baseSummary]);
    const after = buildWorkflowListFingerprint([
      {
        ...baseSummary,
        experiences: [
          {
            ...baseSummary.experiences[0]!,
            description: "Built REST APIs",
          },
        ],
      },
    ]);

    expect(before).not.toBe(after);
  });
});
