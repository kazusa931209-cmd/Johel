import { describe, expect, it } from "vitest";
import {
  buildCombineRecommendUserPrompt,
  getCombineRecommendSystemPrompt,
} from "../prompts.js";

describe("getCombineRecommendSystemPrompt", () => {
  it("uses the default 2–5 pick rule", () => {
    const prompt = getCombineRecommendSystemPrompt(5);
    expect(prompt).toContain("Pick 2–5 experience cards per company when possible");
  });

  it("uses a single-card pick rule when max is 1", () => {
    const prompt = getCombineRecommendSystemPrompt(1);
    expect(prompt).toContain("Pick 1 experience card per company when possible");
    expect(prompt).not.toContain("2–5");
  });

  it("includes JD tier, company scene, and dimension mode rules", () => {
    const prompt = getCombineRecommendSystemPrompt(5, "star_axis", 80);
    expect(prompt).toContain("Company scene fit");
    expect(prompt).toContain("Role context caps JD selection");
    expect(prompt).toContain("index 1 = 100%, index 2 = 80%, index 3 = 64%");
    expect(prompt).toContain("STAR axis");
  });
});

describe("buildCombineRecommendUserPrompt", () => {
  it("includes tier labels per company", () => {
    const prompt = buildCombineRecommendUserPrompt({
      profileId: "profile-1",
      jobDescription: "Backend role",
      experienceDimensionMode: "technical_facet",
      experienceIndex: [
        {
          id: "exp-1",
          category: "API latency",
          problemSummary: "Slow checkout",
        },
      ],
      companies: [
        {
          companyId: "company-1",
          name: "Acme",
          whatCompanyIs: "Retail SaaS platform",
          startDate: "2020",
          endDate: "Present",
          roleContext: "Backend engineer",
          resumeOrderIndex: 1,
          jdTierPercent: "100%",
        },
        {
          companyId: "company-2",
          name: "Beta",
          whatCompanyIs: "Fintech startup",
          startDate: "2018",
          endDate: "2019",
          roleContext: "Junior engineer",
          resumeOrderIndex: 2,
          jdTierPercent: "50%",
        },
      ],
    });

    expect(prompt).toContain("JD selection weight: 100%");
    expect(prompt).toContain("JD selection weight: 50%");
    expect(prompt).toContain("Resume order index: 1");
    expect(prompt).toContain("Resume order index: 2");
    expect(prompt).toContain("What this company is:\nRetail SaaS platform");
  });
});
