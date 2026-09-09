import type { PDFDocument, PDFFont } from "pdf-lib";
import type { GeneratedResume } from "../../domain/generated-resume";
import { PdfLayout } from "../layout";
import {
  DEFAULT_RESUME_PDF_STYLE,
  type ResumePdfStyle,
} from "../styles";

function formatDateRange(startDate?: string, endDate?: string): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

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

export function renderDefaultResumePdf(
  doc: PDFDocument,
  resume: GeneratedResume,
  fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont },
  style: ResumePdfStyle = DEFAULT_RESUME_PDF_STYLE,
): void {
  let page = doc.addPage();
  const layout = new PdfLayout(page, style);
  const addPage = () => {
    page = doc.addPage();
    layout.setPage(page);
    return page;
  };

  layout.drawText(
    resume.header.name,
    {
      font: fonts.bold,
      size: style.headingSize,
      align: "center",
      spacingAfter: style.paragraphSpacing,
    },
    addPage,
  );

  if (resume.header.title?.trim()) {
    layout.drawText(
      resume.header.title.trim(),
      {
        font: fonts.regular,
        size: style.fontSize,
        align: "center",
        spacingAfter: style.paragraphSpacing,
      },
      addPage,
    );
  }

  const contact = contactParts(resume);
  if (contact.length > 0) {
    layout.drawText(
      contact.join(" | "),
      {
        font: fonts.regular,
        size: style.fontSize,
        align: "center",
        spacingAfter: style.sectionSpacing,
      },
      addPage,
    );
  }

  if (resume.summary?.trim()) {
    drawSectionHeading(layout, "Summary", fonts, style, addPage);
    layout.drawText(
      resume.summary.trim(),
      {
        font: fonts.regular,
        size: style.fontSize,
        lineHeight: style.lineHeight,
        spacingAfter: style.sectionSpacing,
      },
      addPage,
    );
  }

  drawSectionHeading(layout, "Experience", fonts, style, addPage);
  for (const [index, experience] of resume.experiences.entries()) {
    if (index > 0) {
      layout.advance(style.paragraphSpacing);
    }

    layout.drawText(
      `${experience.title} — ${experience.company}`,
      {
        font: fonts.bold,
        size: style.fontSize,
        spacingAfter: style.paragraphSpacing / 2,
      },
      addPage,
    );

    const dateRange = formatDateRange(
      experience.startDate,
      experience.endDate,
    );
    const location = experience.location?.trim();
    const meta = [dateRange, location].filter(Boolean).join(" | ");
    if (meta) {
      layout.drawText(
        meta,
        {
          font: fonts.italic,
          size: style.fontSize,
          spacingAfter: style.paragraphSpacing,
        },
        addPage,
      );
    }

    for (const bullet of experience.bullets) {
      layout.drawText(
        `• ${bullet}`,
        {
          font: fonts.regular,
          size: style.fontSize,
          indent: style.bulletIndent,
          maxWidth: layout.currentPage.getWidth() - style.marginLeft - style.marginRight - style.bulletIndent,
          lineHeight: style.lineHeight,
          spacingAfter: style.paragraphSpacing / 2,
        },
        addPage,
      );
    }
  }

  layout.advance(style.sectionSpacing);

  if (resume.skills && resume.skills.length > 0) {
    drawSectionHeading(layout, "Skills", fonts, style, addPage);
    for (const group of resume.skills) {
      layout.drawText(
        `${group.category}: ${group.items.join(", ")}`,
        {
          font: fonts.regular,
          size: style.fontSize,
          lineHeight: style.lineHeight,
          spacingAfter: style.paragraphSpacing,
        },
        addPage,
      );
    }
  }

  if (resume.education && resume.education.length > 0) {
    drawSectionHeading(layout, "Education", fonts, style, addPage);
    for (const education of resume.education) {
      layout.drawText(
        education.institution,
        {
          font: fonts.bold,
          size: style.fontSize,
          spacingAfter: style.paragraphSpacing / 2,
        },
        addPage,
      );

      const degreeParts = [education.degree, education.field]
        .filter((part): part is string => Boolean(part?.trim()))
        .map((part) => part.trim());
      if (degreeParts.length > 0) {
        layout.drawText(
          degreeParts.join(", "),
          {
            font: fonts.regular,
            size: style.fontSize,
            spacingAfter: style.paragraphSpacing / 2,
          },
          addPage,
        );
      }

      const dateRange = formatDateRange(
        education.startDate,
        education.endDate,
      );
      if (dateRange) {
        layout.drawText(
          dateRange,
          {
            font: fonts.italic,
            size: style.fontSize,
            spacingAfter: style.paragraphSpacing,
          },
          addPage,
        );
      }
    }
  }

  if (resume.certifications && resume.certifications.length > 0) {
    drawSectionHeading(layout, "Certifications", fonts, style, addPage);
    for (const certification of resume.certifications) {
      layout.drawText(
        `• ${certification}`,
        {
          font: fonts.regular,
          size: style.fontSize,
          indent: style.bulletIndent,
          lineHeight: style.lineHeight,
          spacingAfter: style.paragraphSpacing / 2,
        },
        addPage,
      );
    }
  }

  if (resume.projects && resume.projects.length > 0) {
    drawSectionHeading(layout, "Projects", fonts, style, addPage);
    for (const project of resume.projects) {
      layout.drawText(
        project.name,
        {
          font: fonts.bold,
          size: style.fontSize,
          spacingAfter: style.paragraphSpacing / 2,
        },
        addPage,
      );

      if (project.description?.trim()) {
        layout.drawText(
          project.description.trim(),
          {
            font: fonts.regular,
            size: style.fontSize,
            lineHeight: style.lineHeight,
            spacingAfter: style.paragraphSpacing / 2,
          },
          addPage,
        );
      }

      if (project.technologies && project.technologies.length > 0) {
        layout.drawText(
          `Technologies: ${project.technologies.join(", ")}`,
          {
            font: fonts.regular,
            size: style.fontSize,
            spacingAfter: style.paragraphSpacing / 2,
          },
          addPage,
        );
      }

      if (project.bullets) {
        for (const bullet of project.bullets) {
          layout.drawText(
            `• ${bullet}`,
            {
              font: fonts.regular,
              size: style.fontSize,
              indent: style.bulletIndent,
              lineHeight: style.lineHeight,
              spacingAfter: style.paragraphSpacing / 2,
            },
            addPage,
          );
        }
      }
    }
  }
}

function drawSectionHeading(
  layout: PdfLayout,
  title: string,
  fonts: { bold: PDFFont },
  style: ResumePdfStyle,
  addPage: () => import("pdf-lib").PDFPage,
): void {
  layout.advance(style.sectionSpacing);
  layout.drawText(
    title,
    {
      font: fonts.bold,
      size: style.sectionHeadingSize,
      spacingAfter: style.paragraphSpacing,
    },
    addPage,
  );
}
