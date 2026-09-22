import type { PDFFont } from "pdf-lib";

export function normalizePdfText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/[\u2018\u2019\u201A\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033\u2036]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
}

export function filterPdfText(
  text: string,
  font: PDFFont,
  size: number,
): string {
  const normalized = normalizePdfText(text);
  let out = "";

  for (const char of normalized) {
    if (char === "\n" || char === "\t") {
      out += char;
      continue;
    }

    try {
      font.widthOfTextAtSize(char, size);
      out += char;
    } catch {
      // Standard Helvetica (WinAnsi) cannot encode this code point.
    }
  }

  return out;
}
