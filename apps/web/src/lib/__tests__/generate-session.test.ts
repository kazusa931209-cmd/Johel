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
import { EMPTY_COMBINE_SNAPSHOT } from "@/components/generate/combine-types";

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

  it("parses legacy workflow session into combine", () => {
    const parsed = parseGenerateSession({
      activeStep: "Workflow",
      job: EMPTY_JOB_STATE,
      workflow: { workflowId: "wf-1" },
    });
    expect(parsed?.activeStep).toBe("Combine");
    expect(parsed?.combine).toEqual({ ...EMPTY_COMBINE_SNAPSHOT });
  });
});

describe("generate-session resume cache", () => {
  const job = {
    ...EMPTY_JOB_STATE,
    jobText: "Engineer role",
    acceptedMarkdown: "# Verdict",
  };
  const combine = {
    ...EMPTY_COMBINE_SNAPSHOT,
    profileId: "profile-1",
    companies: [
      {
        companyId: "company-1",
        startDate: "2020",
        endDate: "Present",
        roleContext: "Backend engineer",
        experienceIds: ["exp-1"],
      },
    ],
  };
  const promptContext = {
    generatePrompt: "Generate a resume",
  };

  it("includes combine content fingerprint in generation input key", () => {
    const combineWithGuidance = {
      ...combine,
      emphasis: "Emphasize leadership",
    };
    const key = buildGenerationInputKey(
      job,
      true,
      combineWithGuidance,
      "fp-v1",
      promptContext,
    );
    expect(key).toContain("fp-v1");
    expect(key).toContain("profile-1");
    expect(key).toContain("generatePromptHash");
    expect(key).toContain("Emphasize leadership");
    expect(key).toContain("# Verdict");
    expect(key).toContain('"jobContextSource":"verdict"');
    expect(key).toContain('"labeledUserMessageVersion":1');
  });

  it("does not reuse stored resume when fingerprint changes", () => {
    const storedKey = buildGenerationInputKey(
      job,
      true,
      combine,
      "fp-v1",
      promptContext,
    );
    const currentKey = buildGenerationInputKey(
      job,
      true,
      combine,
      "fp-v2",
      promptContext,
    );
    expect(
      canReuseStoredResume(
        {
          ...EMPTY_GENERATE_SESSION,
          job,
          combine,
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
