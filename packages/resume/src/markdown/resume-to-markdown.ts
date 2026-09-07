import type { GeneratedResume } from "../domain/generated-resume";

function formatContactLine(resume: GeneratedResume): string | null {
  const contact = resume.header.contact;
  if (!contact) return null;
  const parts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.website,
    contact.linkedin,
    contact.github,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(" | ") : null;
}

function formatDateRange(startDate?: string, endDate?: string): string {
  const start = startDate?.trim() ?? "";
  const end = endDate?.trim() ?? "";
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function resumeToMarkdown(resume: GeneratedResume): string {
  const lines: string[] = [];

  lines.push(`# ${resume.header.name.trim()}`);
  if (resume.header.title?.trim()) {
    lines.push(`## ${resume.header.title.trim()}`);
  }

  const contactLine = formatContactLine(resume);
  if (contactLine) {
    lines.push("", contactLine);
  }

  if (resume.summary?.trim()) {
    lines.push("", "## Summary", "", resume.summary.trim());
  }

  lines.push("", "## Experience");
  for (const experience of resume.experiences) {
    lines.push("");
    const dateRange = formatDateRange(
      experience.startDate,
      experience.endDate,
    );
    const location = experience.location?.trim();
    const meta = [dateRange, location].filter(Boolean).join(" | ");
    lines.push(`### ${experience.title.trim()} — ${experience.company.trim()}`);
    if (meta) {
      lines.push(meta);
    }
    for (const bullet of experience.bullets) {
      lines.push(`- ${bullet.trim()}`);
    }
  }

  if (resume.skills && resume.skills.length > 0) {
    lines.push("", "## Skills");
    for (const group of resume.skills) {
      lines.push(
        "",
        `**${group.category.trim()}:** ${group.items.map((item) => item.trim()).join(", ")}`,
      );
    }
  }

  if (resume.education && resume.education.length > 0) {
    lines.push("", "## Education");
    for (const education of resume.education) {
      lines.push("");
      const degreeParts = [education.degree, education.field]
        .filter((part): part is string => Boolean(part?.trim()))
        .map((part) => part.trim());
      const degreeLine =
        degreeParts.length > 0 ? degreeParts.join(", ") : undefined;
      const dateRange = formatDateRange(
        education.startDate,
        education.endDate,
      );
      lines.push(`### ${education.institution.trim()}`);
      if (degreeLine) {
        lines.push(degreeLine);
      }
      if (dateRange) {
        lines.push(dateRange);
      }
    }
  }

  if (resume.certifications && resume.certifications.length > 0) {
    lines.push("", "## Certifications");
    for (const certification of resume.certifications) {
      lines.push(`- ${certification.trim()}`);
    }
  }

  if (resume.projects && resume.projects.length > 0) {
    lines.push("", "## Projects");
    for (const project of resume.projects) {
      lines.push("", `### ${project.name.trim()}`);
      if (project.description?.trim()) {
        lines.push(project.description.trim());
      }
      if (project.technologies && project.technologies.length > 0) {
        lines.push(
          `**Technologies:** ${project.technologies.map((tech) => tech.trim()).join(", ")}`,
        );
      }
      if (project.bullets) {
        for (const bullet of project.bullets) {
          lines.push(`- ${bullet.trim()}`);
        }
      }
    }
  }

  return lines.join("\n").trim();
}
