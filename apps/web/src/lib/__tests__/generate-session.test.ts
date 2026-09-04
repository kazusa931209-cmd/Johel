import { describe, expect, it } from "vitest";
import {
  buildGenerationInputKey,
  canReuseStoredResume,
  parseGenerateSession,
} from "../generate-session";

describe("generate-session resume helpers", () => {
  const baseSession = {
    activeStep: "PCEW" as const,
    job: {
      method: "manual" as const,
      jobText: "Backend role",
      acceptedMarkdown: "## Verdict",
    },
    pcew: {
      profileId: "profile-1",
      companyIds: ["company-2", "company-1"],
      experienceIds: ["exp-1"],
      workflowId: "workflow-1",
    },
    resume: {
      header: { name: "Jane Doe" },
      experiences: [
        { company: "Acme", title: "Engineer", bullets: ["Built APIs"] },
      ],
    },
    generationInputKey: null as string | null,
  };

  it("builds a stable generation input key", () => {
    const key = buildGenerationInputKey(baseSession.job, baseSession.pcew);
    const keyAgain = buildGenerationInputKey(baseSession.job, baseSession.pcew);
    expect(key).toBe(keyAgain);
    expect(key).toContain("profile-1");
    expect(key).toContain("company-1");
    expect(key).toContain("company-2");
  });

  it("reuses stored resume when fingerprint matches", () => {
    const inputKey = buildGenerationInputKey(baseSession.job, baseSession.pcew);
    const session = { ...baseSession, generationInputKey: inputKey };
    expect(canReuseStoredResume(session, inputKey)).toBe(true);
  });

  it("does not reuse stored resume when fingerprint differs", () => {
    const inputKey = buildGenerationInputKey(baseSession.job, baseSession.pcew);
    const session = {
      ...baseSession,
      generationInputKey: "different-key",
    };
    expect(canReuseStoredResume(session, inputKey)).toBe(false);
  });

  it("parses resume from stored session JSON", () => {
    const inputKey = buildGenerationInputKey(baseSession.job, baseSession.pcew);
    const parsed = parseGenerateSession({
      ...baseSession,
      generationInputKey: inputKey,
    });
    expect(parsed?.resume?.header.name).toBe("Jane Doe");
    expect(parsed?.generationInputKey).toBe(inputKey);
  });
});
