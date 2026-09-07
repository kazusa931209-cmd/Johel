import type { GeneratedResume } from "@johel/resume";
import { parseGeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  EMPTY_WORKFLOW_SELECTION,
  type WorkflowSelection,
} from "@/components/generate/pcew-types";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { hashPromptForCache } from "@/lib/prompt-hash";

export type GenerateJobInputMethod = "url" | "file" | "manual";

export type GenerateJobState = {
  method: GenerateJobInputMethod;
  jobText: string;
  acceptedMarkdown: string | null;
};

export type GenerateSession = {
  activeStep: GenerateStep;
  job: GenerateJobState;
  workflow: WorkflowSelection;
  verdictInputKey: string | null;
  workflowRecommendInputKey: string | null;
  resume: GeneratedResume | null;
  generationInputKey: string | null;
  evaluationMarkdown: string | null;
  evaluationInputKey: string | null;
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
  workflow: EMPTY_WORKFLOW_SELECTION,
  verdictInputKey: null,
  workflowRecommendInputKey: null,
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
    value === "Workflow" ||
    value === "Generate" ||
    value === "Evaluate"
  ) {
    return value;
  }
  if (value === "PCEW" || value === "Verdict" || value === "Company") {
    return "Workflow";
  }
  return "Job";
}

function isJobInputMethod(value: unknown): value is GenerateJobInputMethod {
  return value === "url" || value === "file" || value === "manual";
}

function parseWorkflowSelection(value: unknown): WorkflowSelection {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_WORKFLOW_SELECTION };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.workflowId === "string") {
    return {
      workflowId: raw.workflowId,
      workflowName:
        typeof raw.workflowName === "string" ? raw.workflowName : undefined,
    };
  }
  return { ...EMPTY_WORKFLOW_SELECTION };
}

function parseLegacyWorkflowSelection(value: unknown): WorkflowSelection {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_WORKFLOW_SELECTION };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.workflowId === "string") {
    return {
      workflowId: raw.workflowId,
      workflowName:
        typeof raw.workflowName === "string" ? raw.workflowName : undefined,
    };
  }
  return { ...EMPTY_WORKFLOW_SELECTION };
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

export function buildWorkflowRecommendInputKey(input: {
  job: GenerateJobState;
  threshold: number;
  workflowsFingerprint: string;
}): string {
  return JSON.stringify({
    jobText: noiseFilter(input.job.jobText.trim()).text,
    acceptedMarkdown: input.job.acceptedMarkdown ?? "",
    threshold: input.threshold,
    workflowsFingerprint: input.workflowsFingerprint,
  });
}

export function canReuseStoredWorkflowRecommend(
  session: Pick<GenerateSession, "workflowRecommendInputKey">,
  inputKey: string,
): boolean {
  return Boolean(
    session.workflowRecommendInputKey &&
      session.workflowRecommendInputKey === inputKey,
  );
}

function buildGenerationInputKeyParts(
  job: GenerateJobState,
  workflow: WorkflowSelection,
  workflowContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt">,
) {
  return {
    jobText: job.jobText.trim(),
    acceptedMarkdown: job.acceptedMarkdown ?? "",
    workflowId: workflow.workflowId,
    workflowContentFingerprint,
    generatePromptHash: hashPromptForCache(prompts.generatePrompt ?? ""),
  };
}

export function buildGenerationInputKey(
  job: GenerateJobState,
  workflow: WorkflowSelection,
  workflowContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt">,
): string {
  return JSON.stringify(
    buildGenerationInputKeyParts(
      job,
      workflow,
      workflowContentFingerprint,
      prompts,
    ),
  );
}

export function buildEvaluationInputKey(
  job: GenerateJobState,
  workflow: WorkflowSelection,
  workflowContentFingerprint: string,
  prompts: Pick<PromptCacheContext, "generatePrompt" | "evaluatePrompt">,
): string {
  return JSON.stringify({
    ...buildGenerationInputKeyParts(
      job,
      workflow,
      workflowContentFingerprint,
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

export function parseGenerateSession(value: unknown): GenerateSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const workflow =
    raw.workflow != null
      ? parseWorkflowSelection(raw.workflow)
      : parseLegacyWorkflowSelection(raw.pcew);
  const job = parseJobState(raw.job);
  let verdictInputKey =
    typeof raw.verdictInputKey === "string" ? raw.verdictInputKey : null;
  if (job.acceptedMarkdown && !verdictInputKey) {
    verdictInputKey = buildVerdictInputKey(job, {
      verdictPrompt: "",
    });
  }
  return {
    activeStep: normalizeActiveStep(raw.activeStep),
    job,
    workflow,
    verdictInputKey,
    workflowRecommendInputKey:
      typeof raw.workflowRecommendInputKey === "string"
        ? raw.workflowRecommendInputKey
        : null,
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
  if (session.activeStep !== "Job") return true;
  if (session.evaluationMarkdown) return true;
  if (session.resume) return true;
  if (session.job.acceptedMarkdown) return true;
  if (session.job.jobText.trim()) return true;
  if (session.workflow.workflowId) return true;
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

export function buildWorkflowListFingerprint(
  items: { id: string; name: string; description: string | null; updatedAt: string }[],
): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      updatedAt: item.updatedAt,
    })),
  );
}
