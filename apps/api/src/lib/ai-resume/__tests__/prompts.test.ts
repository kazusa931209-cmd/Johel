import { describe, expect, it } from "vitest";
import { buildAiResumeUserPrompt, getAiResumeSystemPrompt } from "../prompts.js";
import type { ResumeGenerationInput } from "../types.js";

const input: ResumeGenerationInput = {
  jobContext: `## Role
Title: Backend Engineer

## Technical Requirements
Go, PostgreSQL`,
  profile: {
    id: "profile-secret",
    firstName: "Jane",
    lastName: "Doe",
    birthDate: null,
    email: "jane@example.com",
    pn: null,
    residence: null,
    university: "State University",
    graduationYear: 2018,
    graduationMonth: 6,
    degree: "BSc Computer Science",
    links: [{ key: "LinkedIn", link: "https://linkedin.com/in/jane" }],
  },
  companies: [
    {
      id: "company-secret",
      alias: "InternalAcme",
      name: "Acme Corp",
      whatCompanyIs: "B2B payments platform",
      domainAndStack: "Go, PostgreSQL",
      startDate: "2020",
      endDate: "Present",
      roleContext: "Backend engineer",
      experiences: [
        {
          id: "experience-secret",
          category: "API latency",
          problem: "Slow checkout API",
          actions: "Added caching",
          outcome: "Reduced p95 latency by 40%",
        },
      ],
    },
  ],
  run: {
    language: "en",
    emphasis: "Emphasize distributed systems",
  },
};

describe("buildAiResumeUserPrompt", () => {
  it("emits labeled Markdown sections instead of a JSON dump", () => {
    const prompt = buildAiResumeUserPrompt(input);

    expect(prompt).toContain("## Job context");
    expect(prompt).toContain("### Headings in this job context");
    expect(prompt).toContain("- Role");
    expect(prompt).toContain("- Technical Requirements");
    expect(prompt).toContain("## Run intent");
    expect(prompt).toContain("- Language: en");
    expect(prompt).toContain("Run guidance:");
    expect(prompt).toContain("Emphasize distributed systems");
    expect(prompt).toContain("## Profile");
    expect(prompt).toContain("- Name: Jane Doe");
    expect(prompt).toContain("## Companies (resume order)");
    expect(prompt).toContain("### 1. Acme Corp (2020 – Present)");
    expect(prompt).toContain("Role context: Backend engineer");
    expect(prompt).toContain("What this company is:");
    expect(prompt).toContain("Problem:");
    expect(prompt).toContain("Actions:");
    expect(prompt).toContain("Outcome:");
    expect(prompt).toContain("Reduced p95 latency by 40%");
    expect(prompt).not.toContain("InternalAcme");
    expect(prompt).not.toContain("profile-secret");
    expect(prompt).not.toContain("company-secret");
    expect(prompt).not.toContain("experience-secret");
    expect(prompt).not.toMatch(/"jobContext"\s*:/);
    expect(prompt).not.toMatch(/"whatCompanyIs"\s*:/);
  });

  it("skips empty optional profile fields", () => {
    const prompt = buildAiResumeUserPrompt({
      ...input,
      profile: {
        ...input.profile,
        email: null,
        university: null,
        graduationYear: null,
        degree: null,
        links: [],
      },
    });
    expect(prompt).toContain("- Name: Jane Doe");
    expect(prompt).not.toContain("jane@example.com");
    expect(prompt).not.toContain("Education:");
    expect(prompt).not.toContain("Links:");
  });

  it("includes keyword context when provided", () => {
    const prompt = buildAiResumeUserPrompt({
      ...input,
      companies: [
        {
          ...input.companies[0],
          keywordContext: "AWS, AI agents",
        },
      ],
    });

    expect(prompt).toContain("Keyword context: AWS, AI agents");
  });

  it("shows auto keyword context placeholder when empty", () => {
    const prompt = buildAiResumeUserPrompt(input);

    expect(prompt).toContain(
      "Keyword context: (none — match from job context only)",
    );
  });
});

describe("getAiResumeSystemPrompt", () => {
  it("mirrors resume quality execution rules", () => {
    const prompt = getAiResumeSystemPrompt("openai", "Custom generate prompt");

    expect(prompt).toContain("Custom generate prompt");
    expect(prompt).toContain("Keep bullets card-scoped");
    expect(prompt).toContain("Each quantified before→after outcome may appear only once");
    expect(prompt).toContain("When Keyword context is provided for a company");
    expect(prompt).toContain("Build Skills with 12–20 grounded items");
    expect(prompt).toContain(
      'The summary\'s first sentence MUST open with "+{N} years of experience"',
    );
  });
});
