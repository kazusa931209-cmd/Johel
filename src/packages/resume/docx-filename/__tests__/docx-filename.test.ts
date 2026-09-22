import { describe, expect, it } from "vitest";
import {
  buildResumeExportBaseName,
  buildResumeExportFileName,
  buildResumeProfileBundleFileName,
  formatCompactYmd,
  parseGenerationPublicIdParts,
  sanitizeExportFileSegment,
  sanitizeFileNameSegment,
} from "../../docx-filename";

describe("docx-filename", () => {
  it("sanitizes legacy file name segments", () => {
    expect(sanitizeFileNameSegment("John Doe", "resume")).toBe("john-doe");
    expect(sanitizeFileNameSegment("  ", "workflow")).toBe("workflow");
  });

  it("sanitizes export file segments while preserving readable text", () => {
    expect(sanitizeExportFileSegment("Acme Corp", "Company")).toBe("Acme Corp");
    expect(sanitizeExportFileSegment("Senior/Backend", "Role")).toBe(
      "SeniorBackend",
    );
    expect(sanitizeExportFileSegment("  ", "Role")).toBe("Role");
  });

  it("formats compact YYYYMMDD", () => {
    expect(formatCompactYmd(new Date(2026, 8, 5))).toBe("20260905");
  });

  it("parses generation public id date and sequence", () => {
    expect(parseGenerationPublicIdParts("GEN-20260911-006")).toEqual({
      dateYmd: "20260911",
      sequence: "06",
    });
    expect(parseGenerationPublicIdParts("GEN-20260911-073")).toEqual({
      dateYmd: "20260911",
      sequence: "73",
    });
  });

  it("builds export filename from generation metadata", () => {
    const fileName = buildResumeExportFileName(
      {
        publicId: "GEN-20260911-006",
        jdCompanyName: "Acme Corp",
        jdJobRole: "Senior Backend Engineer",
      },
      "docx",
    );
    expect(fileName).toBe(
      "20260911 - 06 - Acme Corp - Senior Backend Engineer.docx",
    );
  });

  it("uses fallbacks when metadata is missing", () => {
    expect(buildResumeExportFileName({}, "pdf")).toMatch(
      /^\d{8} - 00 - Company - Role\.pdf$/,
    );
  });

  it("builds export base name without extension", () => {
    expect(
      buildResumeExportBaseName({
        publicId: "GEN-20260911-006",
        jdCompanyName: "Acme Corp",
        jdJobRole: "Senior Backend Engineer",
      }),
    ).toBe("20260911 - 06 - Acme Corp - Senior Backend Engineer");
  });

  it("builds profile bundle inner file names", () => {
    expect(buildResumeProfileBundleFileName("Jane Q. Public", "docx")).toBe(
      "Jane Q. Public.docx",
    );
    expect(buildResumeProfileBundleFileName("Jane Q. Public", "pdf")).toBe(
      "Jane Q. Public.pdf",
    );
  });
});
