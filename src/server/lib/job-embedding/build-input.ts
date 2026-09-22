import { JOB_TEXT_MAX } from "./constants";

type JobJsonShape = {
  filteredJobText?: string;
  jobText?: string;
};

export function readJobTextFromJson(jobJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jobJson);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const job = parsed as JobJsonShape;
  const filtered = job.filteredJobText?.trim();
  if (filtered) {
    return filtered.slice(0, JOB_TEXT_MAX);
  }

  const raw = job.jobText?.trim();
  return raw ? raw.slice(0, JOB_TEXT_MAX) : null;
}

export function buildJobEmbeddingInput(jobJson: string): string | null {
  const text = readJobTextFromJson(jobJson);
  if (!text) {
    return null;
  }
  return text;
}
