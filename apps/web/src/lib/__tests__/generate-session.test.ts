import { describe, expect, it } from "vitest";
import {
  buildVerdictInputKey,
  canReuseStoredVerdict,
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  parseGenerateSession,
} from "../generate-session";

describe("generate-session verdict cache", () => {
  it("builds verdict input key from noise-filtered job text", () => {
    const key = buildVerdictInputKey({
      ...EMPTY_JOB_STATE,
      jobText: "  Senior Engineer role  ",
    });
    expect(key).toContain("Senior Engineer role");
  });

  it("reuses stored verdict when keys match", () => {
    const inputKey = buildVerdictInputKey({
      ...EMPTY_JOB_STATE,
      jobText: "Engineer",
      acceptedMarkdown: "# Verdict",
    });
    expect(
      canReuseStoredVerdict(
        {
          job: {
            ...EMPTY_JOB_STATE,
            jobText: "Engineer",
            acceptedMarkdown: "# Verdict",
          },
          verdictInputKey: inputKey,
        },
        inputKey,
      ),
    ).toBe(true);
  });

  it("does not reuse stored verdict when key differs", () => {
    const inputKey = buildVerdictInputKey({
      ...EMPTY_JOB_STATE,
      jobText: "Engineer",
      acceptedMarkdown: "# Verdict",
    });
    expect(
      canReuseStoredVerdict(
        {
          job: {
            ...EMPTY_JOB_STATE,
            jobText: "Engineer",
            acceptedMarkdown: "# Verdict",
          },
          verdictInputKey: inputKey,
        },
        buildVerdictInputKey({
          ...EMPTY_JOB_STATE,
          jobText: "Different role",
        }),
      ),
    ).toBe(false);
  });

  it("derives verdict input key for legacy stored sessions", () => {
    const parsed = parseGenerateSession({
      activeStep: "Workflow",
      job: {
        method: "manual",
        jobText: "Engineer",
        acceptedMarkdown: "# Verdict",
      },
      workflow: { workflowId: "wf-1" },
    });
    expect(parsed?.verdictInputKey).toBeTruthy();
    expect(
      canReuseStoredVerdict(
        {
          job: parsed!.job,
          verdictInputKey: parsed!.verdictInputKey,
        },
        buildVerdictInputKey(parsed!.job),
      ),
    ).toBe(true);
  });

  it("parses workflow name from stored session", () => {
    const parsed = parseGenerateSession({
      activeStep: "Job",
      job: EMPTY_JOB_STATE,
      workflow: { workflowId: "wf-1", workflowName: "Senior Backend" },
      verdictInputKey: null,
    });
    expect(parsed?.workflow).toEqual({
      workflowId: "wf-1",
      workflowName: "Senior Backend",
    });
  });

  it("treats empty session as not in progress", () => {
    expect(EMPTY_GENERATE_SESSION.verdictInputKey).toBeNull();
  });
});
