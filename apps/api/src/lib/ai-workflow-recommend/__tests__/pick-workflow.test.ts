import { describe, expect, it } from "vitest";
import { pickRecommendedWorkflow } from "../pick-workflow.js";

describe("pickRecommendedWorkflow", () => {
  it("returns null when no matches", () => {
    expect(pickRecommendedWorkflow([], 70)).toEqual({
      workflowId: null,
      score: null,
    });
  });

  it("picks highest score when it meets threshold", () => {
    expect(
      pickRecommendedWorkflow(
        [
          { workflowId: "a", score: 60 },
          { workflowId: "b", score: 85 },
          { workflowId: "c", score: 72 },
        ],
        70,
      ),
    ).toEqual({ workflowId: "b", score: 85 });
  });

  it("returns null workflow when best score is below threshold", () => {
    expect(
      pickRecommendedWorkflow([{ workflowId: "a", score: 69 }], 70),
    ).toEqual({ workflowId: null, score: 69 });
  });

  it("accepts score equal to threshold", () => {
    expect(
      pickRecommendedWorkflow([{ workflowId: "a", score: 70 }], 70),
    ).toEqual({ workflowId: "a", score: 70 });
  });
});
