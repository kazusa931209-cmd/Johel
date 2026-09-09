import type { GeneratedResume } from "@johel/resume";
import { parseGeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  EMPTY_COMBINE_SNAPSHOT,
  type CombineSnapshot,
} from "@/components/generate/combine-types";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { hashPromptForCache } from "@/lib/prompt-hash";

export type GenerateJobInputMethod = "url" | "file" | "manual";

export type GenerateJobState = {
  method: GenerateJobInputMethod;
  jobText: string;
  acceptedMarkdown: string | null;
};

export type GenerateSession = {
  generationId: string | null;
  generationPublicId: string | null;
  activeStep: GenerateStep;
  job: GenerateJobState;
  combine: CombineSnapshot;
  verdictInputKey: string | null;
  resume: GeneratedResume | null;
  generationInputKey: string | null;
  evaluationMarkdown: string | null;
  evaluationInputKey: string | null;
};

const STORAGE_KEY_PREFIX = "johel:generate-session:";

/** Bumps Generate/Evaluate cache when the AI user-message layout changes. */
export const LABELED_USER_MESSAGE_VERSION = 1;

export const EMPTY_JOB_STATE: GenerateJobState = {
  method: "manual",
  jobText: "",
  acceptedMarkdown: null,
};

export const EMPTY_GENERATE_SESSION: GenerateSession = {
  generationId: null,
  generationPublicId: null,
  activeStep: "Job",
  job: EMPTY_JOB_STATE,
  combine: EMPTY_COMBINE_SNAPSHOT,
  verdictInputKey: null,
  resume: null,
  generationInputKey: null,
  evaluationMarkdown: null,
  evaluationInputKey: null,
};

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function normalizeActiveStep(value: unknown): GenerateStep {
  if (
    value === "Job" ||
    value === "Verdict" ||
    value === "Combine" ||
    value === "Generate" ||
    value === "Evaluate"
  ) {
    return value;
  }
  if (value === "Workflow" || value === "PCEW" || value === "Company") {
    return "Combine";
  }
  return "Job";
}

function isJobInputMethod(value: unknown): value is GenerateJobInputMethod {
  return value === "url" || value === "file" || value === "manual";
}

function parseCombineSnapshot(value: unknown): CombineSnapshot {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_COMBINE_SNAPSHOT };
  }
  const raw = value as Record<string, unknown>;
  const companies = Array.isArray(raw.companies)
    ? raw.companies
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          if (typeof row.companyId !== "string") return null;
          return {
            companyId: row.companyId,
            startDate: typeof row.startDate === "string" ? row.startDate : "",
            endDate: typeof row.endDate === "string" ? row.endDate : "",
            roleContext:
              typeof row.roleContext === "string" ? row.roleContext : "",
            keywordContext:
              typeof row.keywordContext === "string" ? row.keywordContext : "",
            experienceIds: Array.isArray(row.experienceIds)
              ? row.experienceIds.filter(
                  (id): id is string => typeof id === "string",
                )
              : [],
          };
        })
        .filter((entry): entry is CombineSnapshot["companies"][number] =>
          Boolean(entry),
        )
    : [];

  return {
    profileId: typeof raw.profileId === "string" ? raw.profileId : "",
    language: typeof raw.language === "string" ? raw.language : "en",
    emphasis: typeof raw.emphasis === "string" ? raw.emphasis : "",
    companies,
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

function parseStoredResume(value: unknown): GeneratedResume | null {
  if (!value || typeof value !== "object") return null;
  const parsed = parseGeneratedResume(value);
  return parsed.success ? parsed.data : null;
}

export type PromptCacheContext = {
  verdictPrompt?: string;
  generatePrompt?: string;
  evaluatePrompt?: string;
};

export function buildVerdictInputKey(
  job: GenerateJobState,
  prompts: Pick<PromptCacheContext, "verdictPrompt">,
): string {
  return JSON.stringify({
    jobText: noiseFilter(job.jobText.trim()).text,
    verdictPromptHash: hashPromptForCache(prompts.verdictPrompt ?? ""),
  });
}

export function canReuseStoredVerdict(
  session: Pick<GenerateSession, "job" | "verdictInputKey">,
  inputKey: string,
): boolean {
  return Boolean(
    session.job.acceptedMarkdown &&
      session.verdictInputKey &&
      session.verdictInputKey === inputKey,
  );
}

export function buildResumeJobContext(
  job: GenerateJobState,
  doVerdict: boolean,
): string {
  if (doVerdict) {
    return job.acceptedMarkdown?.trim() ?? "";
  }
  return noiseFilter(job.jobText.trim()).text;
}

function buildGenerationInputKeyParts(
  job: GenerateJobState,
  doVerdict: boolean,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt">,
) {
  return {
    labeledUserMessageVersion: LABELED_USER_MESSAGE_VERSION,
    jobContext: buildResumeJobContext(job, doVerdict),
    jobContextSource: doVerdict ? "verdict" : "jobDescription",
    combine,
    combineContentFingerprint,
    generatePromptHash: hashPromptForCache(prompts.generatePrompt ?? ""),
  };
}

export function buildGenerationInputKey(
  job: GenerateJobState,
  doVerdict: boolean,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt">,
): string {
  return JSON.stringify(
    buildGenerationInputKeyParts(
      job,
      doVerdict,
      combine,
      combineContentFingerprint,
      prompts,
    ),
  );
}

export function buildEvaluationInputKey(
  job: GenerateJobState,
  doVerdict: boolean,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt" | "evaluatePrompt">,
): string {
  return JSON.stringify({
    ...buildGenerationInputKeyParts(
      job,
      doVerdict,
      combine,
      combineContentFingerprint,
      prompts,
    ),
    evaluatePromptHash: hashPromptForCache(prompts.evaluatePrompt ?? ""),
  });
}

export function canReuseStoredResume(
  session: GenerateSession,
  inputKey: string,
): boolean {
  return Boolean(
    session.resume &&
      session.generationInputKey &&
      session.generationInputKey === inputKey,
  );
}

export function canReuseStoredEvaluation(
  session: GenerateSession,
  inputKey: string,
): boolean {
  return Boolean(
    session.evaluationMarkdown &&
      session.evaluationInputKey &&
      session.evaluationInputKey === inputKey,
  );
}

/** Clears resume and evaluation; keeps verdict when re-running from Job. */
export function clearDownstreamFromVerdict(
  session: GenerateSession,
): GenerateSession {
  return {
    ...session,
    resume: null,
    generationInputKey: null,
    evaluationMarkdown: null,
    evaluationInputKey: null,
  };
}

/** Clears resume and evaluation before re-running from Combine. */
export function clearDownstreamFromGenerate(
  session: GenerateSession,
): GenerateSession {
  return clearDownstreamFromVerdict(session);
}

export function hasStaleDownstreamForRun(
  session: GenerateSession,
  fromStep: GenerateStep,
): boolean {
  switch (fromStep) {
    case "Job":
    case "Combine":
      return Boolean(session.resume || session.evaluationMarkdown);
    case "Generate":
      return Boolean(session.evaluationMarkdown);
    default:
      return false;
  }
}

export function parseGenerateSession(value: unknown): GenerateSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  let combine =
    raw.combine != null
      ? parseCombineSnapshot(raw.combine)
      : parseCombineSnapshot(raw.workflow ?? raw.pcew);
  const legacyOneTimePrompt =
    typeof raw.oneTimePrompt === "string" ? raw.oneTimePrompt.trim() : "";
  if (legacyOneTimePrompt && !combine.emphasis.trim()) {
    combine = { ...combine, emphasis: legacyOneTimePrompt };
  }
  const job = parseJobState(raw.job);
  let verdictInputKey =
    typeof raw.verdictInputKey === "string" ? raw.verdictInputKey : null;
  if (job.acceptedMarkdown && !verdictInputKey) {
    verdictInputKey = buildVerdictInputKey(job, {
      verdictPrompt: "",
    });
  }
  return {
    generationId:
      typeof raw.generationId === "string" ? raw.generationId : null,
    generationPublicId:
      typeof raw.generationPublicId === "string"
        ? raw.generationPublicId
        : null,
    activeStep: normalizeActiveStep(raw.activeStep),
    job,
    combine,
    verdictInputKey,
    resume: parseStoredResume(raw.resume),
    generationInputKey:
      typeof raw.generationInputKey === "string"
        ? raw.generationInputKey
        : null,
    evaluationMarkdown:
      typeof raw.evaluationMarkdown === "string"
        ? raw.evaluationMarkdown
        : null,
    evaluationInputKey:
      typeof raw.evaluationInputKey === "string"
        ? raw.evaluationInputKey
        : null,
  };
}

export function isGenerateInProgress(session: GenerateSession): boolean {
  if (session.generationId) return true;
  if (session.activeStep !== "Job") return true;
  if (session.evaluationMarkdown) return true;
  if (session.resume) return true;
  if (session.job.acceptedMarkdown) return true;
  if (session.job.jobText.trim()) return true;
  if (session.combine.profileId) return true;
  if (session.combine.companies.length > 0) return true;
  if (session.combine.emphasis.trim()) return true;
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
