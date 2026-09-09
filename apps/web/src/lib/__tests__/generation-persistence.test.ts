import { describe, expect, it } from "vitest";
import { EMPTY_COMBINE_SNAPSHOT } from "@/components/generate/combine-types";
import { EMPTY_JOB_STATE } from "@/lib/generate-session";
import {
  buildGenerationUpdatePayload,
  generationDetailToSession,
} from "@/lib/generation-persistence";
import type { GenerationDetail } from "@/lib/api";

function makeDetail(
  overrides: Partial<GenerationDetail> = {},
): GenerationDetail {
  return {
    id: "gen-internal-1",
    publicId: "GEN-20260910-001",
    finalized: false,
    inputToken: 0,
    outputToken: 0,
    tokenUsed: 0,
    activeStep: "Combine",
    job: {
      ...EMPTY_JOB_STATE,
      jobText: "Engineer role",
      acceptedMarkdown: "# Fit",
    },
    combine: {
      ...EMPTY_COMBINE_SNAPSHOT,
      profileId: "profile-1",
    },
    verdictMarkdown: "# Fit",
    resume: null,
    evaluationMarkdown: null,
    doVerdict: true,
    doEvaluate: true,
    resumeLanguage: "en",
    verdictPrompt: "Check fit",
    generatePrompt: "Write resume",
    evaluatePrompt: "Score resume",
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildGenerationUpdatePayload", () => {
  it("stores filteredJobText on job for server-side AI calls", () => {
    const payload = buildGenerationUpdatePayload({
      generationId: "gen-internal-1",
      activeStep: "Combine",
      job: {
        ...EMPTY_JOB_STATE,
        jobText: "  Engineer role  ",
      },
      combine: EMPTY_COMBINE_SNAPSHOT,
      resume: null,
      evaluationMarkdown: null,
    });

    expect(payload.job.filteredJobText).toBe("Engineer role");
  });
});

describe("generationDetailToSession", () => {
  it("maps generation detail into a generate session", () => {
    const session = generationDetailToSession(makeDetail());
    expect(session.generationId).toBe("gen-internal-1");
    expect(session.generationPublicId).toBe("GEN-20260910-001");
    expect(session.activeStep).toBe("Combine");
    expect(session.job.acceptedMarkdown).toBe("# Fit");
    expect(session.combine.profileId).toBe("profile-1");
    expect(session.verdictInputKey).toContain("verdictPromptHash");
  });

  it("uses verdictMarkdown when job acceptedMarkdown is missing", () => {
    const session = generationDetailToSession(
      makeDetail({
        job: {
          ...EMPTY_JOB_STATE,
          jobText: "Engineer role",
          acceptedMarkdown: null,
        },
        verdictMarkdown: "# Stored verdict",
      }),
    );
    expect(session.job.acceptedMarkdown).toBe("# Stored verdict");
    expect(session.verdictInputKey).toBeTruthy();
  });

  it("marks finalized sessions from detail flag", () => {
    const session = generationDetailToSession(
      makeDetail({ finalized: true }),
    );
    expect(session.finalized).toBe(true);
  });
});
