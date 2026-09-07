import { describe, expect, it } from "vitest";
import {
  buildGenerationInputKey,
  buildVerdictInputKey,
  buildWorkflowListFingerprint,
  buildWorkflowRecommendInputKey,
  canReuseStoredResume,
  canReuseStoredVerdict,
  canReuseStoredWorkflowRecommend,
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  parseGenerateSession,
} from "../generate-session";
import { EMPTY_WORKFLOW_SELECTION } from "@/components/generate/pcew-types";

describe("generate-session verdict cache", () => {
  const promptContext = {
    verdictPrompt: "Check fit",
  };

  it("builds verdict input key from noise-filtered job text", () => {
    const key = buildVerdictInputKey(
      {
        ...EMPTY_JOB_STATE,
        jobText: "  Senior Engineer role  ",
      },
      promptContext,
    );
    expect(key).toContain("Senior Engineer role");
    expect(key).toContain("verdictPromptHash");
  });

  it("reuses stored verdict when keys match", () => {
    const inputKey = buildVerdictInputKey(
      {
        ...EMPTY_JOB_STATE,
        jobText: "Engineer",
        acceptedMarkdown: "# Verdict",
      },
      promptContext,
    );
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
    const inputKey = buildVerdictInputKey(
      {
        ...EMPTY_JOB_STATE,
        jobText: "Engineer",
        acceptedMarkdown: "# Verdict",
      },
      promptContext,
    );
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
        buildVerdictInputKey(
          {
            ...EMPTY_JOB_STATE,
            jobText: "Different role",
          },
          promptContext,
        ),
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
        buildVerdictInputKey(parsed!.job, { verdictPrompt: "" }),
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

describe("generate-session workflow recommend cache", () => {
  const job = {
    ...EMPTY_JOB_STATE,
    jobText: "Engineer role",
    acceptedMarkdown: "# Verdict",
  };
  const fingerprint = buildWorkflowListFingerprint([
    {
      id: "wf-1",
      name: "Backend",
      description: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);

  it("builds recommend input key from job, threshold, and workflows", () => {
    const key = buildWorkflowRecommendInputKey({
      job,
      threshold: 70,
      workflowsFingerprint: fingerprint,
    });
    expect(key).toContain("Engineer role");
    expect(key).toContain("# Verdict");
    expect(key).toContain("70");
  });

  it("reuses stored recommendation when keys match", () => {
    const inputKey = buildWorkflowRecommendInputKey({
      job,
      threshold: 70,
      workflowsFingerprint: fingerprint,
    });
    expect(
      canReuseStoredWorkflowRecommend(
        { workflowRecommendInputKey: inputKey },
        inputKey,
      ),
    ).toBe(true);
  });
});

describe("generate-session resume cache", () => {
  const job = {
    ...EMPTY_JOB_STATE,
    jobText: "Engineer role",
    acceptedMarkdown: "# Verdict",
  };
  const workflow = {
    ...EMPTY_WORKFLOW_SELECTION,
    workflowId: "wf-1",
    workflowName: "Backend",
  };
  const promptContext = {
    generatePrompt: "Generate a resume",
  };

  it("includes workflow content fingerprint in generation input key", () => {
    const key = buildGenerationInputKey(
      job,
      workflow,
      "fp-v1",
      promptContext,
      "Emphasize leadership",
    );
    expect(key).toContain("fp-v1");
    expect(key).toContain("wf-1");
    expect(key).toContain("generatePromptHash");
    expect(key).toContain("Emphasize leadership");
  });

  it("does not reuse stored resume when one-time prompt changes", () => {
    const storedKey = buildGenerationInputKey(
      job,
      workflow,
      "fp-v1",
      promptContext,
      "First prompt",
    );
    const currentKey = buildGenerationInputKey(
      job,
      workflow,
      "fp-v1",
      promptContext,
      "Second prompt",
    );
    expect(
      canReuseStoredResume(
        {
          ...EMPTY_GENERATE_SESSION,
          job,
          workflow,
          oneTimePrompt: "First prompt",
          generationInputKey: storedKey,
          resume: {
            header: {
              name: "Jane Doe",
              title: "Engineer",
              contact: { email: "jane@example.com" },
            },
            summary: "Summary",
            skills: [],
            experiences: [],
            education: [],
            projects: [],
            certifications: [],
          },
        },
        currentKey,
      ),
    ).toBe(false);
  });

  it("does not reuse stored resume when fingerprint changes", () => {
    const storedKey = buildGenerationInputKey(
      job,
      workflow,
      "fp-v1",
      promptContext,
    );
    const currentKey = buildGenerationInputKey(
      job,
      workflow,
      "fp-v2",
      promptContext,
    );
    expect(
      canReuseStoredResume(
        {
          ...EMPTY_GENERATE_SESSION,
          job,
          workflow,
          generationInputKey: storedKey,
          resume: {
            header: {
              name: "Jane Doe",
              title: "Engineer",
              contact: { email: "jane@example.com" },
            },
            summary: "Summary",
            skills: [],
            experiences: [],
            education: [],
            projects: [],
            certifications: [],
          },
        },
        currentKey,
      ),
    ).toBe(false);
  });
});
