import { describe, expect, it } from "vitest";
import { resolveDownloadFormat } from "@/lib/api";

describe("resolveDownloadFormat", () => {
  it("returns docx when resume language is not English", () => {
    expect(
      resolveDownloadFormat({
        doVerdict: true,
        doEvaluate: true,
        resumeLanguage: "ja",
        downloadFormat: "pdf",
        experienceAdvisePoolDepth: "normal",
        combineExperiencesPerCompanyMax: 5,
        experienceDimensionMode: "technical_facet",
      }),
    ).toBe("docx");
  });

  it("returns saved format when resume language is English", () => {
    expect(
      resolveDownloadFormat({
        doVerdict: true,
        doEvaluate: true,
        resumeLanguage: "en",
        downloadFormat: "pdf",
        experienceAdvisePoolDepth: "normal",
        combineExperiencesPerCompanyMax: 5,
        experienceDimensionMode: "technical_facet",
      }),
    ).toBe("pdf");
  });
});
