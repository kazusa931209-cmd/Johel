import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it, beforeAll } from "vitest";
import { filterPdfText, normalizePdfText } from "../text";

describe("pdf text", () => {
  let font: Awaited<ReturnType<PDFDocument["embedFont"]>>;

  beforeAll(async () => {
    const doc = await PDFDocument.create();
    font = await doc.embedFont(StandardFonts.Helvetica);
  });

  it("normalizes common punctuation", () => {
    expect(normalizePdfText("a—b • c")).toBe("a-b * c");
  });

  it("filters unencodable characters", () => {
    expect(filterPdfText("Hello 日本語", font, 11)).toBe("Hello ");
    expect(filterPdfText("café", font, 11)).toBe("café");
  });
});
