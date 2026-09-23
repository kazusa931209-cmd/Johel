import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "@johel/resume";
import { buildDraftRefineUserPrompt } from "../prompts";

const sampleResume: GeneratedResume = {
  header: { name: "Bob" },
  experiences: [
    {
      company: "Acme",
      title: "Engineer",
      bullets: ["Shipped features"],
    },
  ],
};

describe("buildDraftRefineUserPrompt", () => {
  it("includes language and current draft JSON", () => {
    const prompt = buildDraftRefineUserPrompt({
      language: "en",
      resume: sampleResume,
      mode: "instruction",
      instruction: "Shorten the summary",
    });

    expect(prompt).toContain("## Resume language");
    expect(prompt).toContain("en");
    expect(prompt).toContain("Bob");
    expect(prompt).toContain("Shorten the summary");
  });

  it("includes experience materials and company scene", () => {
    const prompt = buildDraftRefineUserPrompt({
      language: "en",
      resume: sampleResume,
      mode: "experiences",
      experiences: [
        {
          id: "exp-1",
          category: "API design",
          problem: "Slow releases",
          actions: "Built CI",
          outcome: "Faster deploys",
        },
      ],
      company: {
        id: "co-1",
        alias: "AC",
        name: "Acme Corp",
        whatCompanyIs: "B2B SaaS",
      },
    });

    expect(prompt).toContain("## Experience materials");
    expect(prompt).toContain("API design");
    expect(prompt).toContain("## Company scene");
    expect(prompt).toContain("B2B SaaS");
  });
});
