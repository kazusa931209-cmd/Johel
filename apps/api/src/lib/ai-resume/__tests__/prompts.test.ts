import { describe, expect, it } from "vitest";
import { buildAiResumeUserPrompt } from "../prompts.js";
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
    education: "BSc Computer Science",
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
    expect(prompt).toContain("## Profile");
    expect(prompt).toContain("- Name: Jane Doe");
    expect(prompt).toContain("## Companies (résumé order)");
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
        education: null,
        links: [],
      },
    });
    expect(prompt).toContain("- Name: Jane Doe");
    expect(prompt).not.toContain("jane@example.com");
    expect(prompt).not.toContain("Education:");
    expect(prompt).not.toContain("Links:");
  });
});
