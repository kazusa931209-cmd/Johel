import { describe, expect, it } from "vitest";
import {
  buildExperienceSplitUserPrompt,
  getExperienceSplitSystemPrompt,
} from "../prompts";

describe("experience split prompts", () => {
  it("includes split-by-capability rules", () => {
    const system = getExperienceSplitSystemPrompt();
    expect(system).toContain("split");
    expect(system).toContain("create_experience");
    expect(system).toContain("different failure modes");
  });

  it("includes source card STAR in user prompt", () => {
    const user = buildExperienceSplitUserPrompt({
      target: {
        id: "exp-1",
        category: "Kubernetes",
        problem: "- **Scale**\n  Cluster grew.",
        actions: "- **Tune**\n  Adjusted limits.",
        outcome: "- **Stable**\n  Fewer incidents.",
      },
      poolIndex: [{ id: "exp-2", category: "APIs", problemSummary: "Latency" }],
    });

    expect(user).toContain("Kubernetes");
    expect(user).toContain("exp-1");
    expect(user).toContain("exp-2");
  });
});
