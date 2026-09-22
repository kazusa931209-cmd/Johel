import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

export function buildSkillsSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  if (!resume.skills || resume.skills.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Skills",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  for (const group of resume.skills) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: style.paragraphSpacing, line: style.lineSpacing },
        children: [
          new TextRun({
            text: `${group.category}: `,
            bold: true,
            size: style.fontSize,
            font: style.fontFamily,
          }),
          new TextRun({
            text: group.items.join(", "),
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );
  }

  return paragraphs;
}
