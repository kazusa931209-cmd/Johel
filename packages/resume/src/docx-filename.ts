import type { GeneratedResume } from "./domain/generated-resume";

export function sanitizeFileNameSegment(
  value: string,
  fallback: string,
): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || fallback;
}

export function formatLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildResumeDocxFileName(
  resume: GeneratedResume,
  workflowName?: string,
  date?: Date,
): string {
  const datePart = formatLocalYmd(date ?? new Date());
  const namePart = sanitizeFileNameSegment(resume.header.name, "resume");
  const workflowPart = sanitizeFileNameSegment(workflowName ?? "", "workflow");
  return `${datePart}-${namePart}-${workflowPart}.docx`;
}
