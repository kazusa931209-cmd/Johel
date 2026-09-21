import { describe, expect, it } from "vitest";
import { deriveProcessedStep } from "../generation-processed-step";

const base = {
  activeStep: "Job",
  jobJson: JSON.stringify({ method: "manual", jobText: "", acceptedMarkdown: null }),
  combineJson: JSON.stringify({
    profileId: "",
    language: "en",
    emphasis: "",
    companies: [],
  }),
  verdictMarkdown: null,
  resumeJson: null,
  evaluationMarkdown: null,
};

describe("deriveProcessedStep", () => {
  it("returns Evaluate when evaluation exists", () => {
    expect(
      deriveProcessedStep({
        ...base,
        evaluationMarkdown: "# Score",
      }),
    ).toBe("Evaluate");
  });

  it("returns Generate when resume exists", () => {
    expect(
      deriveProcessedStep({
        ...base,
        resumeJson: JSON.stringify({ title: "Resume" }),
      }),
    ).toBe("Generate");
  });

  it("returns Combine when combine snapshot has progress", () => {
    expect(
      deriveProcessedStep({
        ...base,
        combineJson: JSON.stringify({
          profileId: "profile-1",
          language: "en",
          emphasis: "",
          companies: [],
        }),
      }),
    ).toBe("Combine");
  });

  it("returns Verdict when verdict markdown exists", () => {
    expect(
      deriveProcessedStep({
        ...base,
        verdictMarkdown: "# Fit",
      }),
    ).toBe("Verdict");
  });

  it("returns Job when only job text exists", () => {
    expect(
      deriveProcessedStep({
        ...base,
        jobJson: JSON.stringify({
          method: "manual",
          jobText: "Engineer role",
          acceptedMarkdown: null,
        }),
      }),
    ).toBe("Job");
  });
});
