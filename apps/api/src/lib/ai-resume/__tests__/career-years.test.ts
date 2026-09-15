import { describe, expect, it } from "vitest";
import {
  calculateTotalExperienceYearsFromCompanies,
  ensureSummaryCareerYears,
  finalizeResumeSummaryCareerYears,
  summaryAlreadyHasCareerYears,
} from "../career-years.js";

describe("calculateTotalExperienceYearsFromCompanies", () => {
  it("sums company employment periods into rounded years", () => {
    expect(
      calculateTotalExperienceYearsFromCompanies([
        { startDate: "Jan 2020", endDate: "Dec 2021" },
        { startDate: "Jan 2022", endDate: "Present" },
      ]),
    ).toBeGreaterThanOrEqual(5);
  });

  it("supports year-only start labels", () => {
    expect(
      calculateTotalExperienceYearsFromCompanies([
        { startDate: "2020", endDate: "Present" },
      ]),
    ).toBeGreaterThanOrEqual(6);
  });
});

describe("ensureSummaryCareerYears", () => {
  it("prepends +N years of experience to the first sentence", () => {
    expect(
      ensureSummaryCareerYears(
        "Backend engineer with payments and platform experience.",
        8,
        "en",
      ),
    ).toBe(
      "+8 years of experience, backend engineer with payments and platform experience.",
    );
  });

  it("keeps an existing career-years lead unchanged", () => {
    const summary =
      "+8 years of experience as a backend engineer with payments experience.";
    expect(ensureSummaryCareerYears(summary, 8, "en")).toBe(summary);
    expect(summaryAlreadyHasCareerYears(summary, "en")).toBe(true);
  });
});

describe("finalizeResumeSummaryCareerYears", () => {
  it("adds summary career years from combine company periods", () => {
    const resume = finalizeResumeSummaryCareerYears(
      {
        header: { name: "Jane Doe" },
        summary: "Platform engineer focused on distributed systems.",
        experiences: [
          {
            company: "Acme",
            title: "Engineer",
            bullets: ["Built APIs"],
          },
        ],
      },
      [{ startDate: "2020", endDate: "Present" }],
      "en",
    );

    expect(resume.summary).toMatch(/^\+[0-9]+ years of experience,/);
  });
});
