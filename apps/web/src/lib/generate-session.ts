import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  EMPTY_PCEW_SELECTION,
  type PcewSelection,
} from "@/components/generate/pcew-types";

export type GenerateJobInputMethod = "url" | "file" | "manual";

export type GenerateJobState = {
  method: GenerateJobInputMethod;
  jobText: string;
  acceptedMarkdown: string | null;
};

export type GenerateSession = {
  activeStep: GenerateStep;
  job: GenerateJobState;
  pcew: PcewSelection;
};

const STORAGE_KEY_PREFIX = "johel:generate-session:";

export const EMPTY_JOB_STATE: GenerateJobState = {
  method: "manual",
  jobText: "",
  acceptedMarkdown: null,
};

export const EMPTY_GENERATE_SESSION: GenerateSession = {
  activeStep: "Job",
  job: EMPTY_JOB_STATE,
  pcew: EMPTY_PCEW_SELECTION,
};

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function normalizeActiveStep(value: unknown): GenerateStep {
  if (value === "Job" || value === "PCEW" || value === "Generate") {
    return value;
  }
  if (value === "Verdict" || value === "Company") {
    return "Generate";
  }
  return "Job";
}

function isJobInputMethod(value: unknown): value is GenerateJobInputMethod {
  return value === "url" || value === "file" || value === "manual";
}

function parsePcewSelection(value: unknown): PcewSelection {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_PCEW_SELECTION };
  }
  const raw = value as Record<string, unknown>;
  return {
    profileId: typeof raw.profileId === "string" ? raw.profileId : "",
    companyIds: Array.isArray(raw.companyIds)
      ? raw.companyIds.filter((id): id is string => typeof id === "string")
      : [],
    experienceIds: Array.isArray(raw.experienceIds)
      ? raw.experienceIds.filter((id): id is string => typeof id === "string")
      : [],
    workflowId: typeof raw.workflowId === "string" ? raw.workflowId : "",
  };
}

function parseJobState(value: unknown): GenerateJobState {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_JOB_STATE };
  }
  const raw = value as Record<string, unknown>;
  return {
    method: isJobInputMethod(raw.method) ? raw.method : "manual",
    jobText: typeof raw.jobText === "string" ? raw.jobText : "",
    acceptedMarkdown:
      typeof raw.acceptedMarkdown === "string" ? raw.acceptedMarkdown : null,
  };
}

export function parseGenerateSession(value: unknown): GenerateSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  return {
    activeStep: normalizeActiveStep(raw.activeStep),
    job: parseJobState(raw.job),
    pcew: parsePcewSelection(raw.pcew),
  };
}

export function isGenerateInProgress(session: GenerateSession): boolean {
  if (session.activeStep !== "Job") return true;
  if (session.job.acceptedMarkdown) return true;
  if (session.job.jobText.trim()) return true;
  if (session.pcew.profileId) return true;
  if (session.pcew.companyIds.length > 0) return true;
  if (session.pcew.experienceIds.length > 0) return true;
  if (session.pcew.workflowId) return true;
  return false;
}

export function loadGenerateSession(userId: string): GenerateSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return parseGenerateSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGenerateSession(userId: string, session: GenerateSession) {
  if (typeof window === "undefined") return;
  try {
    if (!isGenerateInProgress(session)) {
      sessionStorage.removeItem(storageKey(userId));
      return;
    }
    sessionStorage.setItem(storageKey(userId), JSON.stringify(session));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearGenerateSession(userId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore storage errors.
  }
}
