import { describe, expect, it } from "vitest";
import { loadCombineRecommendInputFromGeneration } from "../load-generation-input.js";

const combineJson = JSON.stringify({
  profileId: "profile-1",
  language: "en",
  emphasis: "",
  companies: [
    {
      companyId: "company-1",
      startDate: "Jul 2024",
      endDate: "Present",
      roleContext: "Senior Engineer",
      keywordContext: "AI",
      experienceIds: [],
    },
  ],
});

describe("loadCombineRecommendInputFromGeneration", () => {
  it("loads job, verdict, and combine from generation row", () => {
    const result = loadCombineRecommendInputFromGeneration({
      doVerdict: true,
      jobJson: JSON.stringify({
        jobText: "raw job",
        filteredJobText: "Filtered job description",
      }),
      combineJson,
      verdictMarkdown: "Verdict markdown",
    });

    expect(result).toEqual({
      success: true,
      input: {
        profileId: "profile-1",
        jobDescription: "Filtered job description",
        acceptedMarkdown: "Verdict markdown",
        companies: [
          {
            companyId: "company-1",
            startDate: "Jul 2024",
            endDate: "Present",
            roleContext: "Senior Engineer",
            keywordContext: "AI",
          },
        ],
      },
    });
  });

  it("requires verdict when doVerdict is enabled", () => {
    const result = loadCombineRecommendInputFromGeneration({
      doVerdict: true,
      jobJson: JSON.stringify({ filteredJobText: "Filtered job description" }),
      combineJson,
      verdictMarkdown: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Complete the Verdict step before suggesting experiences.",
    });
  });

  it("falls back to raw job text for legacy rows", () => {
    const result = loadCombineRecommendInputFromGeneration({
      doVerdict: false,
      jobJson: JSON.stringify({ jobText: "Legacy job description" }),
      combineJson,
      verdictMarkdown: null,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.input.jobDescription).toBe("Legacy job description");
    expect(result.input.acceptedMarkdown).toBeUndefined();
  });
});
