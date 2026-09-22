import { hydrateJobJdMetaFromVerdict } from "@johel/jd-meta";
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
  jdCompanyName: string;
  jdJobRole: string;
  /** Persisted on generation save for server-side AI calls. */
  filteredJobText?: string;
};

export type GenerateSession = {
  generationId: string | null;
  generationPublicId: string | null;
  activeStep: GenerateStep;
  job: GenerateJobState;
  combine: CombineSnapshot;
  verdictInputKey: string | null;
  resume: GeneratedResume | null;
  /** Snapshot from the last AI resume generation for Revert. */
  resumeAiSnapshot: GeneratedResume | null;
  generationInputKey: string | null;
  evaluationMarkdown: string | null;
  evaluationInputKey: string | null;
  finalized: boolean;
  /** Filtered JD hash; duplicate dialog skipped until Job text changes. */
  jobDuplicateDismissedHash: string | null;
};

const STORAGE_KEY_PREFIX = "johel:generate-session:";
const LOCAL_OVERLAY_STORAGE_KEY_PREFIX = "johel:generate-session-local:";
const LEGACY_STORAGE_KEY_PREFIX = STORAGE_KEY_PREFIX;

export type GenerateSessionLocalOverlay = {
  generationId: string;
  verdictInputKey: string | null;
  generationInputKey: string | null;
  evaluationInputKey: string | null;
  resumeAiSnapshot: GeneratedResume | null;
  jobDuplicateDismissedHash: string | null;
};

/** Bumps Generate/Evaluate cache when the AI user-message layout changes. */
export const LABELED_USER_MESSAGE_VERSION = 1;

export const EMPTY_JOB_STATE: GenerateJobState = {
  method: "manual",
  jobText: "",
  acceptedMarkdown: null,
  jdCompanyName: "",
  jdJobRole: "",
};

export const EMPTY_GENERATE_SESSION: GenerateSession = {
  generationId: null,
  generationPublicId: null,
  activeStep: "Job",
  job: EMPTY_JOB_STATE,
  combine: EMPTY_COMBINE_SNAPSHOT,
  verdictInputKey: null,
  resume: null,
  resumeAiSnapshot: null,
  generationInputKey: null,
  evaluationMarkdown: null,
  evaluationInputKey: null,
  finalized: false,
  jobDuplicateDismissedHash: null,
};

export function buildJobDuplicateCheckHash(jobText: string): string {
  const filtered = noiseFilter(jobText.trim()).text;
  return hashPromptForCache(filtered);
}

function storageKey(userId: string) {
  return `${LOCAL_OVERLAY_STORAGE_KEY_PREFIX}${userId}`;
}

function legacyStorageKey(userId: string) {
  return `${LEGACY_STORAGE_KEY_PREFIX}${userId}`;
}

function overlayFromSession(
  generationId: string,
  session: GenerateSession,
): GenerateSessionLocalOverlay {
  return {
    generationId,
    verdictInputKey: session.verdictInputKey,
    generationInputKey: session.generationInputKey,
    evaluationInputKey: session.evaluationInputKey,
    resumeAiSnapshot: session.resumeAiSnapshot,
    jobDuplicateDismissedHash: session.jobDuplicateDismissedHash,
  };
}

function applyLocalOverlay(
  session: GenerateSession,
  overlay: GenerateSessionLocalOverlay | null,
): GenerateSession {
  if (!overlay || overlay.generationId !== session.generationId) {
    return session;
  }
  return {
    ...session,
    verdictInputKey: overlay.verdictInputKey,
    generationInputKey: overlay.generationInputKey,
    evaluationInputKey: overlay.evaluationInputKey,
    resumeAiSnapshot: overlay.resumeAiSnapshot,
    jobDuplicateDismissedHash: overlay.jobDuplicateDismissedHash,
  };
}

function parseLocalOverlay(value: unknown): GenerateSessionLocalOverlay | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.generationId !== "string" || !raw.generationId) {
    return null;
  }
  return {
    generationId: raw.generationId,
    verdictInputKey:
      typeof raw.verdictInputKey === "string" ? raw.verdictInputKey : null,
    generationInputKey:
      typeof raw.generationInputKey === "string"
        ? raw.generationInputKey
        : null,
    evaluationInputKey:
      typeof raw.evaluationInputKey === "string"
        ? raw.evaluationInputKey
        : null,
    resumeAiSnapshot: parseStoredResume(raw.resumeAiSnapshot),
    jobDuplicateDismissedHash:
      typeof raw.jobDuplicateDismissedHash === "string"
        ? raw.jobDuplicateDismissedHash
        : null,
  };
}

/** @deprecated Legacy full-session storage; migrated into local overlay on read. */
export function loadGenerateSession(userId: string): GenerateSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(legacyStorageKey(userId));
    if (!raw) return null;
    return parseGenerateSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadGenerateSessionLocalOverlay(
  userId: string,
  generationId: string | null,
): GenerateSessionLocalOverlay | null {
  if (typeof window === "undefined" || !generationId) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (raw) {
      const overlay = parseLocalOverlay(JSON.parse(raw));
      if (overlay?.generationId === generationId) {
        return overlay;
      }
    }
  } catch {
    // fall through to legacy migration
  }

  const legacy = loadGenerateSession(userId);
  if (!legacy?.generationId || legacy.generationId !== generationId) {
    return null;
  }

  const overlay = overlayFromSession(generationId, legacy);
  saveGenerateSessionLocalOverlay(userId, generationId, legacy);
  try {
    sessionStorage.removeItem(legacyStorageKey(userId));
  } catch {
    // ignore
  }
  return overlay;
}

export function mergeServerSessionWithLocalOverlay(
  userId: string,
  session: GenerateSession,
): GenerateSession {
  if (!session.generationId) {
    return session;
  }
  const overlay = loadGenerateSessionLocalOverlay(userId, session.generationId);
  return applyLocalOverlay(session, overlay);
}

export function saveGenerateSessionLocalOverlay(
  userId: string,
  generationId: string | null,
  session: GenerateSession,
) {
  if (typeof window === "undefined") return;
  try {
    if (!generationId || !isGenerateInProgress(session)) {
      sessionStorage.removeItem(storageKey(userId));
      return;
    }
    sessionStorage.setItem(
      storageKey(userId),
      JSON.stringify(overlayFromSession(generationId, session)),
    );
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearGenerateSessionLocalOverlay(userId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(userId));
    sessionStorage.removeItem(legacyStorageKey(userId));
  } catch {
    // Ignore storage errors.
  }
}

/** @deprecated Use saveGenerateSessionLocalOverlay; kept for call-site migration. */
export function saveGenerateSession(userId: string, session: GenerateSession) {
  saveGenerateSessionLocalOverlay(userId, session.generationId, session);
}

/** @deprecated Use clearGenerateSessionLocalOverlay. */
export function clearGenerateSession(userId: string) {
  clearGenerateSessionLocalOverlay(userId);
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
    userInstruction:
      typeof raw.userInstruction === "string" ? raw.userInstruction : "",
    platform: typeof raw.platform === "string" ? raw.platform : "",
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
    jdCompanyName:
      typeof raw.jdCompanyName === "string" ? raw.jdCompanyName : "",
    jdJobRole: typeof raw.jdJobRole === "string" ? raw.jdJobRole : "",
    filteredJobText:
      typeof raw.filteredJobText === "string" ? raw.filteredJobText : undefined,
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

export function hashResumeForCache(resume: GeneratedResume | null): string {
  if (!resume) return "";
  return hashPromptForCache(JSON.stringify(resume));
}

export function buildEvaluationInputKey(
  job: GenerateJobState,
  doVerdict: boolean,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt" | "evaluatePrompt">,
  resume: GeneratedResume | null,
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
    resumeHash: hashResumeForCache(resume),
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
    job: {
      ...session.job,
      jdCompanyName: "",
      jdJobRole: "",
    },
    resume: null,
    resumeAiSnapshot: null,
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
  const job = hydrateJobJdMetaFromVerdict(parseJobState(raw.job));
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
    resumeAiSnapshot: parseStoredResume(raw.resumeAiSnapshot),
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
    finalized: raw.finalized === true,
    jobDuplicateDismissedHash:
      typeof raw.jobDuplicateDismissedHash === "string"
        ? raw.jobDuplicateDismissedHash
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
