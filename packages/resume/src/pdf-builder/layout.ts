import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { filterPdfText } from "./text";
import {
  DEFAULT_RESUME_PDF_STYLE,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  type ResumePdfStyle,
} from "./styles";

type DrawTextOptions = {
  font: PDFFont;
  size: number;
  color?: RGB;
  align?: "left" | "center";
  indent?: number;
  maxWidth?: number;
  lineHeight?: number;
  spacingAfter?: number;
};

export class PdfLayout {
  private readonly style: ResumePdfStyle;
  private page: PDFPage;
  private y: number;
  private readonly contentWidth: number;

  constructor(
    page: PDFPage,
    style: ResumePdfStyle = DEFAULT_RESUME_PDF_STYLE,
  ) {
    this.style = style;
    this.page = page;
    this.y = PDF_PAGE_HEIGHT - style.marginTop;
    this.contentWidth =
      PDF_PAGE_WIDTH - style.marginLeft - style.marginRight;
  }

  get currentPage(): PDFPage {
    return this.page;
  }

  setPage(page: PDFPage): void {
    this.page = page;
    this.y = PDF_PAGE_HEIGHT - this.style.marginTop;
  }

  private minY(): number {
    return this.style.marginBottom;
  }

  private ensureSpace(height: number, addPage: () => PDFPage): void {
    if (this.y - height < this.minY()) {
      this.setPage(addPage());
    }
  }

  advance(amount: number): void {
    this.y -= amount;
  }

  drawText(
    text: string,
    options: DrawTextOptions,
    addPage: () => PDFPage,
  ): void {
    const safeText = filterPdfText(text, options.font, options.size);
    if (!safeText.trim()) return;

    const lineHeight = options.lineHeight ?? options.size * 1.2;
    const indent = options.indent ?? 0;
    const maxWidth = options.maxWidth ?? this.contentWidth - indent;
    const lines = wrapText(safeText, options.font, options.size, maxWidth);
    if (lines.length === 0) return;
    const blockHeight = lines.length * lineHeight;
    this.ensureSpace(blockHeight, addPage);

    for (const line of lines) {
      const textWidth = options.font.widthOfTextAtSize(line, options.size);
      let x = this.style.marginLeft + indent;
      if (options.align === "center") {
        x = this.style.marginLeft + (this.contentWidth - textWidth) / 2;
      }
      this.page.drawText(line, {
        x,
        y: this.y - options.size,
        size: options.size,
        font: options.font,
        color: options.color,
      });
      this.y -= lineHeight;
    }

    if (options.spacingAfter) {
      this.y -= options.spacingAfter;
    }
  }
}

export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [normalized];
}
