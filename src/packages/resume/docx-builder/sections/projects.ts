import { Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

export function buildProjectsSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  if (!resume.projects || resume.projects.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: style.sectionSpacing, after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: "Projects",
          bold: true,
          size: style.sectionHeadingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  for (const project of resume.projects) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: style.paragraphSpacing },
        children: [
          new TextRun({
            text: project.name,
            bold: true,
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );

    if (project.description?.trim()) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing },
          children: [
            new TextRun({
              text: project.description.trim(),
              size: style.fontSize,
              font: style.fontFamily,
            }),
          ],
        }),
      );
    }

    if (project.technologies && project.technologies.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: style.paragraphSpacing },
          children: [
            new TextRun({
              text: "Technologies: ",
              bold: true,
              size: style.fontSize,
              font: style.fontFamily,
            }),
            new TextRun({
              text: project.technologies.join(", "),
              size: style.fontSize,
              font: style.fontFamily,
            }),
          ],
        }),
      );
    }

    if (project.bullets) {
      for (const bullet of project.bullets) {
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
  }

  return paragraphs;
}
