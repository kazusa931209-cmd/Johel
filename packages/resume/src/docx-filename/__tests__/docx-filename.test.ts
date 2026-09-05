import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import {
  buildResumeDocxFileName,
  formatLocalYmd,
  sanitizeFileNameSegment,
} from "../../docx-filename";

const sampleResume: GeneratedResume = {
  header: {
    name: "John Doe",
    title: "Engineer",
    contact: { email: "john@example.com" },
  },
  summary: "Summary",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
};

describe("docx-filename", () => {
  it("sanitizes file name segments", () => {
    expect(sanitizeFileNameSegment("John Doe", "resume")).toBe("john-doe");
    expect(sanitizeFileNameSegment("  ", "workflow")).toBe("workflow");
  });

  it("formats local YYYY-MM-DD", () => {
    expect(formatLocalYmd(new Date(2026, 8, 5))).toBe("2026-09-05");
  });

  it("builds date-name-workflow filename", () => {
    const fileName = buildResumeDocxFileName(
      sampleResume,
      "Senior Backend",
      new Date(2026, 8, 5),
    );
    expect(fileName).toBe("2026-09-05-john-doe-senior-backend.docx");
  });

  it("uses fallbacks when name or workflow are empty", () => {
    const resume: GeneratedResume = {
      ...sampleResume,
      header: { ...sampleResume.header, name: "   " },
    };
    const fileName = buildResumeDocxFileName(
      resume,
      undefined,
      new Date(2026, 8, 5),
    );
    expect(fileName).toBe("2026-09-05-resume-workflow.docx");
  });
});
