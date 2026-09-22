import { hydrateJobJdMetaFromVerdict } from "@johel/jd-meta";
import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  buildEvaluationInputKey,
  buildGenerationInputKey,
  buildVerdictInputKey,
  EMPTY_GENERATE_SESSION,
  parseGenerateSession,
  mergeServerSessionWithLocalOverlay,
  type GenerateJobState,
  type GenerateSession,
} from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  getCombineGenerationFingerprint,
  getCurrentGeneration,
  resumeGeneration,
  startGeneration,
  updateGeneration,
  type GenerationDetail,
  type GenerationResumePayload,
} from "@/lib/api";

export type GenerationSnapshot = {
  generationId: string;
  activeStep: GenerateStep;
  job: GenerateJobState;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
  evaluationMarkdown: string | null;
  finalized?: boolean;
};

export function buildGenerationUpdatePayload(snapshot: GenerationSnapshot) {
  const filteredJobText = noiseFilter(snapshot.job.jobText.trim()).text;
  return {
    activeStep: snapshot.activeStep,
    job: {
      ...snapshot.job,
      filteredJobText,
    },
    combine: snapshot.combine,
    verdictMarkdown: snapshot.job.acceptedMarkdown,
    resume: snapshot.resume,
    evaluationMarkdown: snapshot.evaluationMarkdown,
    ...(snapshot.finalized === true ? { finalized: true } : {}),
  };
}

export async function persistGenerationSnapshot(snapshot: GenerationSnapshot) {
  return updateGeneration(
    snapshot.generationId,
    buildGenerationUpdatePayload(snapshot),
  );
}

export async function allocateNewGeneration() {
  return startGeneration();
}

export function generationDetailToSession(
  detail: GenerationDetail,
): GenerateSession {
  const job = hydrateJobJdMetaFromVerdict(
    detail.verdictMarkdown && !detail.job.acceptedMarkdown
      ? { ...detail.job, acceptedMarkdown: detail.verdictMarkdown }
      : detail.job,
  );

  const session =
    parseGenerateSession({
      generationId: detail.id,
      generationPublicId: detail.publicId,
      activeStep: detail.activeStep,
      job,
      combine: detail.combine,
      resume: detail.resume,
      evaluationMarkdown: detail.evaluationMarkdown,
      finalized: detail.finalized,
    }) ?? {
      ...EMPTY_GENERATE_SESSION,
      generationId: detail.id,
      generationPublicId: detail.publicId,
    };

  if (!job.acceptedMarkdown) {
    return session;
  }

  return {
    ...session,
    verdictInputKey: buildVerdictInputKey(job, {
      verdictPrompt: detail.verdictPrompt,
    }),
  };
}

async function hydrateSessionCacheKeys(
  session: GenerateSession,
  detail: GenerationDetail,
): Promise<GenerateSession> {
  if (!session.resume) {
    return session;
  }

  const fingerprintRes = await getCombineGenerationFingerprint(session.combine);
  const fingerprint = fingerprintRes.data?.fingerprint;
  if (!fingerprint) {
    return session;
  }

  const generationInputKey = buildGenerationInputKey(
    session.job,
    detail.doVerdict,
    session.combine,
    fingerprint,
    { generatePrompt: detail.generatePrompt },
  );

  const evaluationInputKey = session.evaluationMarkdown
    ? buildEvaluationInputKey(
        session.job,
        detail.doVerdict,
        session.combine,
        fingerprint,
        {
          generatePrompt: detail.generatePrompt,
          evaluatePrompt: detail.evaluatePrompt,
        },
        session.resume,
      )
    : null;

  return {
    ...session,
    generationInputKey,
    evaluationInputKey,
  };
}

export async function fetchCurrentGenerationSession(
  userId: string,
): Promise<GenerateSession | null> {
  const res = await getCurrentGeneration();
  if (!res.data) {
    return null;
  }

  let session = generationDetailToSession(res.data);
  if (!session.generationId) {
    return null;
  }

  session = await hydrateSessionCacheKeys(session, res.data);
  return mergeServerSessionWithLocalOverlay(userId, session);
}

function sessionToSnapshot(
  session: GenerateSession,
  finalized?: boolean,
): GenerationSnapshot | null {
  if (!session.generationId) return null;
  return {
    generationId: session.generationId,
    activeStep: session.activeStep,
    job: session.job,
    combine: session.combine,
    resume: session.resume,
    evaluationMarkdown: session.evaluationMarkdown,
    ...(finalized === true ? { finalized: true } : {}),
  };
}

function buildResumeArchivePayload(
  session: GenerateSession,
): GenerationResumePayload["archive"] | undefined {
  if (!session.generationId) return undefined;
  const snapshot = sessionToSnapshot(session, session.finalized ? true : undefined);
  if (!snapshot) return undefined;
  return {
    generationId: snapshot.generationId,
    ...buildGenerationUpdatePayload(snapshot),
  };
}

export async function resumeGenerationFromHistory(
  targetPublicId: string,
  userId: string,
): Promise<{ error?: string; session?: GenerateSession }> {
  const currentRes = await getCurrentGeneration();
  const current = currentRes.data
    ? generationDetailToSession(currentRes.data)
    : null;
  const archive =
    current?.generationId &&
    current.generationPublicId &&
    current.generationPublicId !== targetPublicId
      ? buildResumeArchivePayload(current)
      : undefined;

  const res = await resumeGeneration(targetPublicId, { archive });
  if (!res.data) {
    return { error: res.error ?? "Failed to resume generation." };
  }

  let session = generationDetailToSession(res.data);
  session = { ...session, finalized: false };
  session = await hydrateSessionCacheKeys(session, res.data);
  session = mergeServerSessionWithLocalOverlay(userId, session);
  return { session };
}
