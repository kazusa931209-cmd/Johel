import { describe, expect, it } from "vitest";
import { normalizeDownloadFormat } from "../settings-process.js";

describe("normalizeDownloadFormat", () => {
  it("coerces pdf to docx when resume language is not English", () => {
    expect(normalizeDownloadFormat("ja", "pdf")).toBe("docx");
    expect(normalizeDownloadFormat("ko", "pdf")).toBe("docx");
  });

  it("keeps pdf when resume language is English", () => {
    expect(normalizeDownloadFormat("en", "pdf")).toBe("pdf");
    expect(normalizeDownloadFormat("en", "docx")).toBe("docx");
  });
});
