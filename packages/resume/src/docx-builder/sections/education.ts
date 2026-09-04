import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

function formatDateRange(startDate?: string, endDate?: string): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function buildEducationSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  if (!resume.education || resume.education.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Education",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  for (const education of resume.education) {
    const degreeParts = [education.degree, education.field]
      .filter((part): part is string => Boolean(part?.trim()))
      .map((part) => part.trim());
    const dateRange = formatDateRange(
      education.startDate,
      education.endDate,
    );

    paragraphs.push(
      new Paragraph({
        spacing: { after: style.paragraphSpacing },
        children: [
          new TextRun({
            text: education.institution,
            bold: true,
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );

    if (degreeParts.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing },
          children: [
            new TextRun({
              text: degreeParts.join(", "),
              size: style.fontSize,
              font: style.fontFamily,
            }),
          ],
        }),
      );
    }

    if (dateRange) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing, line: style.lineSpacing },
          children: [
            new TextRun({
              text: dateRange,
              italics: true,
              size: style.fontSize,
              font: style.fontFamily,
            }),
          ],
        }),
      );
    }
  }

  return paragraphs;
}
