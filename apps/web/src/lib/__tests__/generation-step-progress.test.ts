import { describe, expect, it } from "vitest";
import { EMPTY_COMBINE_SNAPSHOT } from "@/components/generate/combine-types";
import { EMPTY_JOB_STATE } from "@/lib/generate-session";
import {
  deriveProcessedStepFromSession,
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

  it("does not treat remembered Combine defaults as progress on a fresh Job step", () => {
    expect(
      deriveProcessedStepFromSession({
        activeStep: "Job",
        job: EMPTY_JOB_STATE,
        combine: {
          ...EMPTY_COMBINE_SNAPSHOT,
          profileId: "prof-1",
          companies: [
            {
              companyId: "co-1",
              startDate: "Jan 2022",
              endDate: "Present",
              roleContext: "Lead",
              keywordContext: "",
              experienceIds: [],
            },
          ],
        },
        resume: null,
        evaluationMarkdown: null,
      }),
    ).toBe("Job");
  });

  it("counts Combine selection once the active step reaches Combine", () => {
    expect(
      deriveProcessedStepFromSession({
        activeStep: "Combine",
        job: { ...EMPTY_JOB_STATE, acceptedMarkdown: "# Fit" },
        combine: {
          ...EMPTY_COMBINE_SNAPSHOT,
          profileId: "prof-1",
          companies: [],
        },
        resume: null,
        evaluationMarkdown: null,
      }),
    ).toBe("Combine");
  });
});
