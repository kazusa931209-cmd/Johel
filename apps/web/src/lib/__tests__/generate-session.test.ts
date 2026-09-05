import { describe, expect, it } from "vitest";
import {
  buildGenerationInputKey,
  canReuseStoredEvaluation,
  canReuseStoredResume,
  parseGenerateSession,
} from "../generate-session";

describe("generate-session resume helpers", () => {
  const baseSession = {
    activeStep: "Workflow" as const,
    job: {
      method: "manual" as const,
      jobText: "Backend role",
      acceptedMarkdown: "## Verdict",
    },
    workflow: {
      workflowId: "workflow-1",
    },
    resume: {
      header: { name: "Jane Doe" },
      experiences: [
        { company: "Acme", title: "Engineer", bullets: ["Built APIs"] },
      ],
    },
    generationInputKey: null as string | null,
    evaluationMarkdown: null as string | null,
    evaluationInputKey: null as string | null,
  };

  it("builds a stable generation input key", () => {
    const key = buildGenerationInputKey(baseSession.job, baseSession.workflow);
    const keyAgain = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    expect(key).toBe(keyAgain);
    expect(key).toContain("workflow-1");
  });

  it("reuses stored resume when fingerprint matches", () => {
    const inputKey = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    const session = { ...baseSession, generationInputKey: inputKey };
    expect(canReuseStoredResume(session, inputKey)).toBe(true);
  });

  it("does not reuse stored resume when fingerprint differs", () => {
    const inputKey = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    const session = {
      ...baseSession,
      generationInputKey: "different-key",
    };
    expect(canReuseStoredResume(session, inputKey)).toBe(false);
  });

  it("reuses stored evaluation when fingerprint matches", () => {
    const inputKey = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    const session = {
      ...baseSession,
      evaluationMarkdown: "## ATS Score\n\n85/100",
      evaluationInputKey: inputKey,
    };
    expect(canReuseStoredEvaluation(session, inputKey)).toBe(true);
  });

  it("does not reuse stored evaluation when fingerprint differs", () => {
    const inputKey = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    const session = {
      ...baseSession,
      evaluationMarkdown: "## ATS Score\n\n85/100",
      evaluationInputKey: "different-key",
    };
    expect(canReuseStoredEvaluation(session, inputKey)).toBe(false);
  });

  it("parses resume from stored session JSON", () => {
    const inputKey = buildGenerationInputKey(
      baseSession.job,
      baseSession.workflow,
    );
    const parsed = parseGenerateSession({
      ...baseSession,
      generationInputKey: inputKey,
    });
    expect(parsed?.resume?.header.name).toBe("Jane Doe");
    expect(parsed?.generationInputKey).toBe(inputKey);
  });

  it("parses legacy pcew session shape", () => {
    const parsed = parseGenerateSession({
      activeStep: "PCEW",
      job: baseSession.job,
      pcew: { workflowId: "workflow-legacy" },
      resume: null,
      generationInputKey: null,
    });
    expect(parsed?.activeStep).toBe("Workflow");
    expect(parsed?.workflow.workflowId).toBe("workflow-legacy");
  });
});
