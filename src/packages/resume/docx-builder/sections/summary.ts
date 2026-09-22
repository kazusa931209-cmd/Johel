import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

export function buildSummarySection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  if (!resume.summary?.trim()) return [];

  return [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Summary",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: style.sectionSpacing, line: style.lineSpacing },
      children: [
        new TextRun({
          text: resume.summary.trim(),
          size: style.fontSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];
}
