import type { GeneratedResume } from "../domain/generated-resume";
import {
  parseGeneratedResume,
  type GeneratedResumeContact,
  type GeneratedResumeEducation,
  type GeneratedResumeExperience,
  type GeneratedResumeProject,
  type GeneratedResumeSkillGroup,
} from "../domain/generated-resume";

const SECTION_HEADERS = new Set([
  "summary",
  "experience",
  "skills",
  "education",
  "certifications",
  "projects",
]);

const CONTACT_KEYS: (keyof GeneratedResumeContact)[] = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
];

const EXPERIENCE_TITLE_SEPARATOR = " — ";

export type MarkdownToResumeResult =
  | { success: true; data: GeneratedResume }
  | { success: false; error: string };

function isSectionHeader(line: string): boolean {
  const match = /^##\s+(.+)$/.exec(line.trim());
  if (!match) return false;
  return SECTION_HEADERS.has(match[1].trim().toLowerCase());
}

function sectionName(line: string): string {
  const match = /^##\s+(.+)$/.exec(line.trim());
  return match?.[1].trim().toLowerCase() ?? "";
}

function parseContactLine(line: string): GeneratedResumeContact | undefined {
  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;

  const contact: GeneratedResumeContact = {};
  for (let i = 0; i < parts.length && i < CONTACT_KEYS.length; i += 1) {
    contact[CONTACT_KEYS[i]] = parts[i];
  }
  return contact;
}

function parseDateRange(line: string): {
  startDate?: string;
  endDate?: string;
} {
  const trimmed = line.trim();
  const dashIndex = trimmed.indexOf(" – ");
  if (dashIndex >= 0) {
    return {
      startDate: trimmed.slice(0, dashIndex).trim() || undefined,
      endDate: trimmed.slice(dashIndex + 3).trim() || undefined,
    };
  }
  return trimmed ? { startDate: trimmed } : {};
}

function parseExperienceMeta(line: string): {
  startDate?: string;
  endDate?: string;
  location?: string;
} {
  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};

  const dates = parseDateRange(parts[0]);
  if (parts.length === 1) {
    if (dates.startDate || dates.endDate) {
      return dates;
    }
    return { location: parts[0] };
  }

  return {
    ...dates,
    location: parts.slice(1).join(" | ") || undefined,
  };
}

function parseExperienceHeading(line: string): { title: string; company: string } | null {
  const match = /^###\s+(.+)$/.exec(line.trim());
  if (!match) return null;

  const heading = match[1].trim();
  const separatorIndex = heading.indexOf(EXPERIENCE_TITLE_SEPARATOR);
  if (separatorIndex < 0) {
    return null;
  }

  const title = heading.slice(0, separatorIndex).trim();
  const company = heading.slice(separatorIndex + EXPERIENCE_TITLE_SEPARATOR.length).trim();
  if (!title || !company) return null;
  return { title, company };
}

function parseSkillLine(line: string): GeneratedResumeSkillGroup | null {
  const match = /^\*\*(.+?):\*\*\s*(.+)$/.exec(line.trim());
  if (!match) return null;

  const category = match[1].trim();
  const items = match[2]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!category || items.length === 0) return null;
  return { category, items };
}

function parseTechnologiesLine(line: string): string[] | null {
  const match = /^\*\*Technologies:\*\*\s*(.+)$/.exec(line.trim());
  if (!match) return null;
  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectSectionBody(
  lines: string[],
  startIndex: number,
): { body: string[]; nextIndex: number } {
  const body: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (/^##\s+/.test(line.trim())) {
      break;
    }
    body.push(line);
    index += 1;
  }
  return { body, nextIndex: index };
}

function parseSummarySection(body: string[]): string | undefined {
  const text = body.join("\n").trim();
  return text || undefined;
}

function parseExperienceSection(body: string[]): GeneratedResumeExperience[] {
  const experiences: GeneratedResumeExperience[] = [];
  let index = 0;

  while (index < body.length) {
    while (index < body.length && !body[index].trim()) {
      index += 1;
    }
    if (index >= body.length) break;

    const heading = parseExperienceHeading(body[index]);
    if (!heading) {
      index += 1;
      continue;
    }
    index += 1;

    let startDate: string | undefined;
    let endDate: string | undefined;
    let location: string | undefined;

    if (index < body.length && body[index].trim() && !body[index].trim().startsWith("-")) {
      const meta = parseExperienceMeta(body[index]);
      startDate = meta.startDate;
      endDate = meta.endDate;
      location = meta.location;
      index += 1;
    }

    const bullets: string[] = [];
    while (index < body.length) {
      const line = body[index].trim();
      if (!line) {
        index += 1;
        if (bullets.length > 0 && index < body.length && body[index].trim().startsWith("###")) {
          break;
        }
        continue;
      }
      if (line.startsWith("###")) break;
      if (line.startsWith("-")) {
        bullets.push(line.slice(1).trim());
        index += 1;
        continue;
      }
      break;
    }

    if (bullets.length > 0) {
      experiences.push({
        company: heading.company,
        title: heading.title,
        ...(location ? { location } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        bullets,
      });
    }
  }

  return experiences;
}

function parseSkillsSection(body: string[]): GeneratedResumeSkillGroup[] {
  const groups: GeneratedResumeSkillGroup[] = [];
  for (const line of body) {
    const group = parseSkillLine(line);
    if (group) groups.push(group);
  }
  return groups;
}

function parseEducationSection(body: string[]): GeneratedResumeEducation[] {
  const education: GeneratedResumeEducation[] = [];
  let index = 0;

  while (index < body.length) {
    while (index < body.length && !body[index].trim()) {
      index += 1;
    }
    if (index >= body.length) break;

    const match = /^###\s+(.+)$/.exec(body[index].trim());
    if (!match) {
      index += 1;
      continue;
    }
    const institution = match[1].trim();
    index += 1;

    let degree: string | undefined;
    let field: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

    const pendingLines: string[] = [];
    while (index < body.length) {
      const line = body[index].trim();
      if (!line) {
        index += 1;
        continue;
      }
      if (line.startsWith("###")) break;
      pendingLines.push(line);
      index += 1;
    }

    for (const line of pendingLines) {
      const dates = parseDateRange(line);
      if (line.includes(" – ") || /^\d{4}/.test(line)) {
        startDate = dates.startDate;
        endDate = dates.endDate;
      } else if (!degree) {
        const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
        degree = parts[0];
        field = parts.slice(1).join(", ") || undefined;
      }
    }

    education.push({
      institution,
      ...(degree ? { degree } : {}),
      ...(field ? { field } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  }

  return education;
}

function parseCertificationsSection(body: string[]): string[] {
  return body
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.slice(1).trim())
    .filter(Boolean);
}

function parseProjectsSection(body: string[]): GeneratedResumeProject[] {
  const projects: GeneratedResumeProject[] = [];
  let index = 0;

  while (index < body.length) {
    while (index < body.length && !body[index].trim()) {
      index += 1;
    }
    if (index >= body.length) break;

    const match = /^###\s+(.+)$/.exec(body[index].trim());
    if (!match) {
      index += 1;
      continue;
    }
    const name = match[1].trim();
    index += 1;

    let description: string | undefined;
    let technologies: string[] | undefined;
    const bullets: string[] = [];

    while (index < body.length) {
      const line = body[index].trim();
      if (!line) {
        index += 1;
        continue;
      }
      if (line.startsWith("###")) break;

      const tech = parseTechnologiesLine(line);
      if (tech) {
        technologies = tech;
        index += 1;
        continue;
      }
      if (line.startsWith("-")) {
        bullets.push(line.slice(1).trim());
        index += 1;
        continue;
      }
      if (!description) {
        description = line;
        index += 1;
        continue;
      }
      break;
    }

    projects.push({
      name,
      ...(description ? { description } : {}),
      ...(technologies && technologies.length > 0 ? { technologies } : {}),
      ...(bullets.length > 0 ? { bullets } : {}),
    });
  }

  return projects;
}

export function markdownToResume(markdown: string): MarkdownToResumeResult {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  const nameMatch = /^#\s+(.+)$/.exec(lines[index]?.trim() ?? "");
  if (!nameMatch) {
    return { success: false, error: "Resume must start with a # Name heading." };
  }
  const name = nameMatch[1].trim();
  if (!name) {
    return { success: false, error: "Name heading cannot be empty." };
  }
  index += 1;

  let title: string | undefined;
  let contact: GeneratedResumeContact | undefined;
  let summary: string | undefined;
  let experiences: GeneratedResumeExperience[] = [];
  let skills: GeneratedResumeSkillGroup[] | undefined;
  let education: GeneratedResumeEducation[] | undefined;
  let certifications: string[] | undefined;
  let projects: GeneratedResumeProject[] | undefined;

  while (index < lines.length && !isSectionHeader(lines[index])) {
    const line = lines[index].trim();
    index += 1;
    if (!line) continue;

    if (/^##\s+/.test(line)) {
      title = line.slice(2).trim() || undefined;
      continue;
    }

    if (!contact && !title && line.includes("|")) {
      contact = parseContactLine(line);
      continue;
    }

    if (!contact && !title) {
      contact = parseContactLine(line);
      if (!contact) {
        title = line;
      }
      continue;
    }

    if (!contact) {
      contact = parseContactLine(line);
    }
  }

  while (index < lines.length) {
    const section = sectionName(lines[index]);
    index += 1;
    const { body, nextIndex } = collectSectionBody(lines, index);
    index = nextIndex;

    switch (section) {
      case "summary":
        summary = parseSummarySection(body);
        break;
      case "experience":
        experiences = parseExperienceSection(body);
        break;
      case "skills":
        skills = parseSkillsSection(body);
        break;
      case "education":
        education = parseEducationSection(body);
        break;
      case "certifications":
        certifications = parseCertificationsSection(body);
        break;
      case "projects":
        projects = parseProjectsSection(body);
        break;
      default:
        break;
    }
  }

  if (experiences.length === 0) {
    return { success: false, error: "At least one experience entry is required." };
  }

  const resume: GeneratedResume = {
    header: {
      name,
      ...(title ? { title } : {}),
      ...(contact ? { contact } : {}),
    },
    experiences,
    ...(summary ? { summary } : {}),
    ...(skills && skills.length > 0 ? { skills } : {}),
    ...(education && education.length > 0 ? { education } : {}),
    ...(certifications && certifications.length > 0 ? { certifications } : {}),
    ...(projects && projects.length > 0 ? { projects } : {}),
  };

  return parseGeneratedResume(resume);
}
