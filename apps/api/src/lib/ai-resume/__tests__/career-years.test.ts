import { describe, expect, it } from "vitest";
import {
  calculateTotalExperienceYearsFromCompanies,
  educationDateToYearOnly,
  ensureSummaryCareerYears,
  finalizeResumeSummaryCareerYears,
  normalizeEducationDatesInResume,
  replaceSummaryCareerYearsLead,
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

  it("keeps an existing career-years lead when the value is correct", () => {
    const summary =
      "+8 years of experience as a backend engineer with payments experience.";
    expect(ensureSummaryCareerYears(summary, 8, "en")).toBe(summary);
    expect(summaryAlreadyHasCareerYears(summary, "en")).toBe(true);
  });

  it("replaces a wrong AI career-years lead with the computed value", () => {
    const summary =
      "+7 years of experience as a backend engineer with payments experience.";
    expect(ensureSummaryCareerYears(summary, 5, "en")).toBe(
      "+5 years of experience as a backend engineer with payments experience.",
    );
  });
});

describe("replaceSummaryCareerYearsLead", () => {
  it("replaces only the lead phrase", () => {
    expect(
      replaceSummaryCareerYearsLead(
        "+7 years of experience, platform engineer.",
        5,
        "en",
      ),
    ).toBe("+5 years of experience, platform engineer.");
  });
});

describe("educationDateToYearOnly", () => {
  it("keeps year-only labels unchanged", () => {
    expect(educationDateToYearOnly("2018")).toBe("2018");
  });

  it("strips month from ISO and month-name labels", () => {
    expect(educationDateToYearOnly("2018-06")).toBe("2018");
    expect(educationDateToYearOnly("Jun 2018")).toBe("2018");
  });
});

describe("normalizeEducationDatesInResume", () => {
  it("normalizes education end dates to year only", () => {
    const resume = normalizeEducationDatesInResume({
      header: { name: "Jane Doe" },
      experiences: [
        { company: "Acme", title: "Engineer", bullets: ["Built APIs"] },
      ],
      education: [
        {
          institution: "State University",
          degree: "BSc",
          endDate: "2018-06",
        },
      ],
    });

    expect(resume.education?.[0]?.endDate).toBe("2018");
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
