import { AlignmentType, Paragraph, TextRun } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import type { ResumeDocxStyle } from "../styles";

function contactParts(resume: GeneratedResume): string[] {
  const contact = resume.header.contact;
  if (!contact) return [];
  return [
    contact.email,
    contact.phone,
    contact.location,
    contact.website,
    contact.linkedin,
    contact.github,
  ].filter((part): part is string => Boolean(part?.trim()));
}

export function buildHeaderSection(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: style.paragraphSpacing },
      children: [
        new TextRun({
          text: resume.header.name,
          bold: true,
          size: style.headingSize,
          font: style.fontFamily,
        }),
      ],
    }),
  ];

  if (resume.header.title?.trim()) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: style.paragraphSpacing },
        children: [
          new TextRun({
            text: resume.header.title.trim(),
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );
  }

  const parts = contactParts(resume);
  if (parts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: style.sectionSpacing },
        children: [
          new TextRun({
            text: parts.join(" | "),
            size: style.fontSize,
            font: style.fontFamily,
          }),
        ],
      }),
    );
  }

  return paragraphs;
}
