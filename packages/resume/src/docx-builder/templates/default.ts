import type { Paragraph } from "docx";
import type { GeneratedResume } from "../../domain/generated-resume";
import { buildCertificationsSection } from "../sections/certifications";
import { buildEducationSection } from "../sections/education";
import { buildExperienceSection } from "../sections/experience";
import { buildHeaderSection } from "../sections/header";
import { buildProjectsSection } from "../sections/projects";
import { buildSkillsSection } from "../sections/skills";
import { buildSummarySection } from "../sections/summary";
import {
  DEFAULT_RESUME_DOCX_STYLE,
  type ResumeDocxStyle,
} from "../styles";

export function buildDefaultResumeDocxChildren(
  resume: GeneratedResume,
  style: ResumeDocxStyle = DEFAULT_RESUME_DOCX_STYLE,
): Paragraph[] {
  return [
    ...buildHeaderSection(resume, style),
    ...buildSummarySection(resume, style),
    ...buildExperienceSection(resume, style),
    ...buildSkillsSection(resume, style),
    ...buildEducationSection(resume, style),
    ...buildCertificationsSection(resume, style),
    ...buildProjectsSection(resume, style),
  ];
}
