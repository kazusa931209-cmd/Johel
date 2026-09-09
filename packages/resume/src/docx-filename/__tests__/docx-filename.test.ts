import { describe, expect, it } from "vitest";
import type { GeneratedResume } from "../../domain/generated-resume";
import {
  buildResumeDocxFileName,
  buildResumeExportFileName,
  buildResumePdfFileName,
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

  it("builds pdf export filename", () => {
    const fileName = buildResumePdfFileName(
      sampleResume,
      "Senior Backend",
      new Date(2026, 8, 5),
    );
    expect(fileName).toBe("2026-09-05-john-doe-senior-backend.pdf");
  });

  it("builds export filename for each format", () => {
    expect(
      buildResumeExportFileName(
        sampleResume,
        "Senior Backend",
        "docx",
        new Date(2026, 8, 5),
      ),
    ).toBe("2026-09-05-john-doe-senior-backend.docx");
    expect(
      buildResumeExportFileName(
        sampleResume,
        "Senior Backend",
        "pdf",
        new Date(2026, 8, 5),
      ),
    ).toBe("2026-09-05-john-doe-senior-backend.pdf");
  });
});
