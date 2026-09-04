import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

function formatDateRange(startDate?: string, endDate?: string): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function buildExperienceSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Experience",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  for (const [index, experience] of resume.experiences.entries()) {
    const dateRange = formatDateRange(
      experience.startDate,
      experience.endDate,
    );
    const location = experience.location?.trim();
    const meta = [dateRange, location].filter(Boolean).join(" | ");

    paragraphs.push(
      new Paragraph({
        spacing: { before: index === 0 ? 0 : style.paragraphSpacing },
        children: [
          new TextRun({
            text: `${experience.title} — ${experience.company}`,
            bold: true,
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );

    if (meta) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing },
          children: [
            new TextRun({
              text: meta,
              italics: true,
              size: style.fontSize,
              font: style.fontFamily,
            }),
          ],
        }),
      );
    }

    for (const bullet of experience.bullets) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing, line: style.lineSpacing },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: bullet,
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
