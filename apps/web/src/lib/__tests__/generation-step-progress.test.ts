import { describe, expect, it } from "vitest";
import {
  getHistoryVisibleSteps,
  isProcessedThroughStep,
} from "../generation-step-progress";

describe("generation-step-progress", () => {
  it("lists visible steps from process flags", () => {
    expect(getHistoryVisibleSteps(true, true)).toEqual([
      "Job",
      "Verdict",
      "Combine",
      "Generate",
      "Evaluate",
    ]);
    expect(getHistoryVisibleSteps(false, false)).toEqual([
      "Job",
      "Combine",
      "Generate",
    ]);
  });

  it("marks steps through processed step as finished", () => {
    expect(isProcessedThroughStep("Job", "Combine")).toBe(true);
    expect(isProcessedThroughStep("Verdict", "Combine")).toBe(true);
    expect(isProcessedThroughStep("Combine", "Combine")).toBe(true);
    expect(isProcessedThroughStep("Generate", "Combine")).toBe(false);
    expect(isProcessedThroughStep("Evaluate", "Generate")).toBe(false);
  });
});
