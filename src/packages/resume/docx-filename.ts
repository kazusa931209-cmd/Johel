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

export function sanitizeExportFileSegment(
  value: string,
  fallback: string,
): string {
  const sanitized = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized || fallback;
}

export function formatLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCompactYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export type ResumeExportFormat = "docx" | "pdf";

export type ResumeExportNameInput = {
  publicId?: string | null;
  jdCompanyName?: string;
  jdJobRole?: string;
  exportDate?: Date;
};

export function parseGenerationPublicIdParts(publicId: string): {
  dateYmd: string;
  sequence: string;
} | null {
  const match = /^GEN-(\d{8})-(\d+)$/i.exec(publicId.trim());
  if (!match) {
    return null;
  }

  const sequenceNumber = Number.parseInt(match[2], 10);
  if (Number.isNaN(sequenceNumber)) {
    return null;
  }

  return {
    dateYmd: match[1],
    sequence: String(sequenceNumber).padStart(2, "0"),
  };
}

export function buildResumeExportFileName(
  input: ResumeExportNameInput,
  format: ResumeExportFormat = "docx",
): string {
  const parsed = input.publicId
    ? parseGenerationPublicIdParts(input.publicId)
    : null;
  const dateYmd =
    parsed?.dateYmd ?? formatCompactYmd(input.exportDate ?? new Date());
  const sequence = parsed?.sequence ?? "00";
  const company = sanitizeExportFileSegment(
    input.jdCompanyName ?? "",
    "Company",
  );
  const role = sanitizeExportFileSegment(input.jdJobRole ?? "", "Role");
  return `${dateYmd} - ${sequence} - ${company} - ${role}.${format}`;
}

/** @deprecated Legacy helper; prefer buildResumeExportFileName with ResumeExportNameInput. */
export function buildResumeDocxFileName(
  resume: GeneratedResume,
  workflowName?: string,
  date?: Date,
): string {
  void resume;
  return buildResumeExportFileName(
    { jdJobRole: workflowName, exportDate: date },
    "docx",
  );
}

/** @deprecated Legacy helper; prefer buildResumeExportFileName with ResumeExportNameInput. */
export function buildResumePdfFileName(
  runLabel?: string,
  date?: Date,
): string {
  return buildResumeExportFileName(
    { jdJobRole: runLabel, exportDate: date },
    "pdf",
  );
}
