import { describe, expect, it } from "vitest";
import {
  getAdjacentGenerateStep,
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "../generate-steps";

describe("generate-steps", () => {
  it("returns four steps when evaluate is enabled", () => {
    expect(getGenerateSteps(true)).toEqual([
      "Job",
      "Workflow",
      "Generate",
      "Evaluate",
    ]);
  });

  it("returns three steps when evaluate is disabled", () => {
    expect(getGenerateSteps(false)).toEqual(["Job", "Workflow", "Generate"]);
  });

  it("normalizes Evaluate to Generate when evaluate is disabled", () => {
    expect(normalizeGenerateActiveStep("Evaluate", false)).toBe("Generate");
  });

  it("returns adjacent steps within the visible list", () => {
    const steps = getGenerateSteps(false);
    expect(getAdjacentGenerateStep(steps, "Generate", "prev")).toBe("Workflow");
    expect(getAdjacentGenerateStep(steps, "Workflow", "next")).toBe("Generate");
    expect(getAdjacentGenerateStep(steps, "Generate", "next")).toBeNull();
  });
});
