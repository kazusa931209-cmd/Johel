import { describe, expect, it } from "vitest";
import {
  buildGenerationInputKey,
  buildVerdictInputKey,
  canReuseStoredResume,
  canReuseStoredVerdict,
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  parseGenerateSession,
} from "../generate-session";
import { EMPTY_WORKFLOW_SELECTION } from "@/components/generate/pcew-types";

describe("generate-session verdict cache", () => {
  const promptContext = {
    verdictPrompt: "Check fit",
    usePromptOptimizationAi: true,
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
    expect(key).toContain("usePromptOptimizationAi");
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
        buildVerdictInputKey(parsed!.job, {
          verdictPrompt: "",
          usePromptOptimizationAi: true,
        }),
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
    usePromptOptimizationAi: true,
  };

  it("includes workflow content fingerprint in generation input key", () => {
    const key = buildGenerationInputKey(job, workflow, "fp-v1", promptContext);
    expect(key).toContain("fp-v1");
    expect(key).toContain("wf-1");
    expect(key).toContain("generatePromptHash");
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
            experience: [],
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
