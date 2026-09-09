import { describe, expect, it } from "vitest";
import {
  getAdjacentGenerateStep,
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "../generate-steps";

describe("generate-steps", () => {
  it("returns five steps when verdict and evaluate are enabled", () => {
    expect(getGenerateSteps(true, true)).toEqual([
      "Job",
      "Verdict",
      "Combine",
      "Generate",
      "Evaluate",
    ]);
  });

  it("returns four steps when verdict is disabled", () => {
    expect(getGenerateSteps(true, false)).toEqual([
      "Job",
      "Combine",
      "Generate",
      "Evaluate",
    ]);
  });

  it("returns three steps when evaluate is disabled", () => {
    expect(getGenerateSteps(false, false)).toEqual([
      "Job",
      "Combine",
      "Generate",
    ]);
  });

  it("normalizes Evaluate to Generate when evaluate is disabled", () => {
    expect(normalizeGenerateActiveStep("Evaluate", false, true)).toBe("Generate");
  });

  it("normalizes Verdict to Combine when verdict is disabled", () => {
    expect(normalizeGenerateActiveStep("Verdict", true, false)).toBe("Combine");
  });

  it("returns adjacent steps within the visible list", () => {
    const steps = getGenerateSteps(false, false);
    expect(getAdjacentGenerateStep(steps, "Generate", "prev")).toBe("Combine");
    expect(getAdjacentGenerateStep(steps, "Combine", "next")).toBe("Generate");
    expect(getAdjacentGenerateStep(steps, "Generate", "next")).toBeNull();
  });
});
