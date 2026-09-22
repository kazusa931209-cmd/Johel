import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

export function buildCertificationsSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  if (!resume.certifications || resume.certifications.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Certifications",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  for (const certification of resume.certifications) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: style.paragraphSpacing, line: style.lineSpacing },
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: certification,
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );
  }

  return paragraphs;
}
