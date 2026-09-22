import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  parseGenerateSession,
  type GenerateSession,
} from "@/lib/generate-session";
import {
  getCurrentGeneralGeneration,
  resumeGeneralGeneration,
  startGeneralGeneration,
  updateGeneralGeneration,
  type GeneralGenerationDetail,
} from "@/lib/api";

export type GeneralResumeSnapshot = {
  generationId: string;
  activeStep: GenerateStep;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
  evaluationMarkdown: string | null;
  finalized?: boolean;
};

export function buildGeneralResumeUpdatePayload(snapshot: GeneralResumeSnapshot) {
  return {
    activeStep: snapshot.activeStep,
    combine: snapshot.combine,
    resume: snapshot.resume,
    evaluationMarkdown: snapshot.evaluationMarkdown,
    ...(snapshot.finalized === true ? { finalized: true } : {}),
  };
}

export async function persistGeneralResumeSnapshot(snapshot: GeneralResumeSnapshot) {
  return updateGeneralGeneration(
    snapshot.generationId,
    buildGeneralResumeUpdatePayload(snapshot),
  );
}

export function generalGenerationDetailToSession(
  detail: GeneralGenerationDetail,
): GenerateSession {
  const parsed =
    parseGenerateSession({
      generationId: detail.id,
      generationPublicId: detail.publicId,
      activeStep: detail.activeStep,
      job: EMPTY_JOB_STATE,
      combine: detail.combine,
      resume: detail.resume,
      evaluationMarkdown: detail.evaluationMarkdown,
      finalized: detail.finalized,
    }) ?? {
      ...EMPTY_GENERATE_SESSION,
      generationId: detail.id,
      generationPublicId: detail.publicId,
      activeStep: detail.activeStep as GenerateStep,
      job: EMPTY_JOB_STATE,
    };

  return {
    ...parsed,
    activeStep: (parsed.activeStep === "Job" || parsed.activeStep === "Verdict"
      ? "Combine"
      : parsed.activeStep) as GenerateStep,
  };
}

export async function fetchCurrentGeneralResumeSession(): Promise<GenerateSession | null> {
  const res = await getCurrentGeneralGeneration();
  if (!res.data) {
    return null;
  }

  const session = generalGenerationDetailToSession(res.data);
  if (!session.generationId) {
    return null;
  }

  return session;
}

function sessionToSnapshot(
  session: GenerateSession,
  finalized?: boolean,
): GeneralResumeSnapshot | null {
  if (!session.generationId) return null;
  return {
    generationId: session.generationId,
    activeStep: session.activeStep,
    combine: session.combine,
    resume: session.resume,
    evaluationMarkdown: session.evaluationMarkdown,
    ...(finalized === true ? { finalized: true } : {}),
  };
}

function buildResumeArchivePayload(
  session: GenerateSession,
): { generationId: string } & ReturnType<typeof buildGeneralResumeUpdatePayload> | undefined {
  if (!session.generationId) return undefined;
  const snapshot = sessionToSnapshot(session, session.finalized ? true : undefined);
  if (!snapshot) return undefined;
  return {
    generationId: snapshot.generationId,
    ...buildGeneralResumeUpdatePayload(snapshot),
  };
}

export async function resumeGeneralGenerationFromHistory(
  targetPublicId: string,
): Promise<{ error?: string; session?: GenerateSession }> {
  const currentRes = await getCurrentGeneralGeneration();
  const current = currentRes.data
    ? generalGenerationDetailToSession(currentRes.data)
    : null;
  const archive =
    current?.generationId &&
    current.generationPublicId &&
    current.generationPublicId !== targetPublicId
      ? buildResumeArchivePayload(current)
      : undefined;

  const res = await resumeGeneralGeneration(targetPublicId, { archive });
  if (!res.data) {
    return { error: res.error ?? "Failed to resume general resume." };
  }

  const session = { ...generalGenerationDetailToSession(res.data), finalized: false };
  return { session };
}

export async function allocateNewGeneralResume() {
  return startGeneralGeneration();
}
