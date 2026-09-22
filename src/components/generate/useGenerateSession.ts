"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  EMPTY_COMBINE_SNAPSHOT,
  type CombineSnapshot,
} from "@/components/generate/combine-types";
import { clearMeCache, loadMe } from "@/lib/cached-settings";
import {
  clearDownstreamFromGenerate,
  clearDownstreamFromVerdict,
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  type GenerateJobState,
  type GenerateSession,
  clearGenerateSessionLocalOverlay,
  saveGenerateSessionLocalOverlay,
} from "@/lib/generate-session";
import { notifyGenerateSessionChanged } from "@/lib/generate-session-events";
import { deriveProcessedStepFromSession } from "@/lib/generation-step-progress";
import {
  persistCombineDefaultsFromSnapshot,
  seedCombineFromDefaults,
} from "@/lib/combine-defaults";
import {
  allocateNewGeneration,
  fetchCurrentGenerationSession,
  persistGenerationSnapshot,
  type GenerationSnapshot,
} from "@/lib/generation-persistence";

function withoutResume(session: GenerateSession): GenerateSession {
  return {
    ...session,
    resume: null,
    resumeAiSnapshot: null,
    generationInputKey: null,
    evaluationMarkdown: null,
    evaluationInputKey: null,
  };
}

function toGenerationSnapshot(
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

export function useGenerateSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GenerateSession>(EMPTY_GENERATE_SESSION);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const startingRef = useRef(false);
  const allocationEpochRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const meRes = await loadMe();
      if (cancelled) return;

      const id = meRes.data?.id ?? null;
      setUserId(id);
      if (!id) {
        setReady(true);
        return;
      }

      const restored = await fetchCurrentGenerationSession(id);
      if (cancelled) return;
      if (restored?.generationId) {
        setSession({
          ...restored,
          combine: seedCombineFromDefaults(restored.combine, id),
        });
      }

      setReady(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureGenerationStarted = useCallback(async () => {
    if (startingRef.current) return null;
    startingRef.current = true;
    try {
      const res = await allocateNewGeneration();
      if (!res.data) {
        return null;
      }
      return res.data;
    } finally {
      startingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!ready || !userId || session.generationId) return;
    const epoch = allocationEpochRef.current;
    let cancelled = false;
    void ensureGenerationStarted().then((started) => {
      if (
        cancelled ||
        !started ||
        epoch !== allocationEpochRef.current
      ) {
        return;
      }
      setSession((current) => ({
        ...current,
        generationId: started.id,
        generationPublicId: started.publicId,
        combine: seedCombineFromDefaults(current.combine, userId),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [ensureGenerationStarted, ready, session.generationId, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    saveGenerateSessionLocalOverlay(userId, session.generationId, session);
    notifyGenerateSessionChanged(userId, {
      generationId: session.generationId,
      generationPublicId: session.generationPublicId,
      processedStep: deriveProcessedStepFromSession(session),
      finalized: session.finalized,
    });
  }, [ready, session, userId]);

  const saveSnapshot = useCallback(async (finalized?: boolean) => {
    const snapshot = toGenerationSnapshot(sessionRef.current, finalized);
    if (!snapshot) {
      return { error: "Generation session is not ready." };
    }
    return persistGenerationSnapshot(snapshot);
  }, []);

  const setActiveStep = useCallback((activeStep: GenerateStep) => {
    setSession((current) => ({ ...current, activeStep }));
  }, []);

  const setJob = useCallback((job: GenerateJobState) => {
    setSession((current) => ({
      ...current,
      job,
      jobDuplicateDismissedHash:
        job.jobText.trim() === current.job.jobText.trim()
          ? current.jobDuplicateDismissedHash
          : null,
    }));
  }, []);

  const patchJob = useCallback((patch: Partial<GenerateJobState>) => {
    setSession((current) => {
      const nextJob = { ...current.job, ...patch };
      return {
        ...current,
        job: nextJob,
        jobDuplicateDismissedHash:
          typeof patch.jobText === "string" &&
          patch.jobText.trim() !== current.job.jobText.trim()
            ? null
            : current.jobDuplicateDismissedHash,
      };
    });
  }, []);

  const combineDefaultsPersistTimerRef = useRef<number | null>(null);
  const latestCombineForPersistRef = useRef<CombineSnapshot>(
    EMPTY_COMBINE_SNAPSHOT,
  );

  const setCombine = useCallback(
    (combine: CombineSnapshot) => {
      latestCombineForPersistRef.current = combine;
      setSession((current) => {
        const next = { ...current, combine };
        sessionRef.current = next;
        return next;
      });
      if (!userId) {
        return;
      }
      if (combineDefaultsPersistTimerRef.current != null) {
        window.clearTimeout(combineDefaultsPersistTimerRef.current);
      }
      combineDefaultsPersistTimerRef.current = window.setTimeout(() => {
        combineDefaultsPersistTimerRef.current = null;
        persistCombineDefaultsFromSnapshot(
          userId,
          latestCombineForPersistRef.current,
        );
      }, 300);
    },
    [userId],
  );

  useEffect(
    () => () => {
      if (combineDefaultsPersistTimerRef.current != null) {
        window.clearTimeout(combineDefaultsPersistTimerRef.current);
      }
    },
    [],
  );

  const clearDownstreamFromVerdictSession = useCallback(() => {
    setSession((current) => clearDownstreamFromVerdict(current));
  }, []);

  const clearDownstreamFromGenerateSession = useCallback(() => {
    setSession((current) => clearDownstreamFromGenerate(current));
  }, []);

  const setVerdictResult = useCallback(
    (
      acceptedMarkdown: string,
      verdictInputKey: string,
      jdMeta?: { jdCompanyName: string; jdJobRole: string },
    ) => {
      setSession((current) =>
        withoutResume({
          ...current,
          job: {
            ...current.job,
            acceptedMarkdown,
            ...(jdMeta
              ? {
                  jdCompanyName: jdMeta.jdCompanyName,
                  jdJobRole: jdMeta.jdJobRole,
                }
              : {}),
          },
          verdictInputKey,
        }),
      );
    },
    [],
  );

  const setResumeResult = useCallback(
    (resume: GeneratedResume, generationInputKey: string) => {
      setSession((current) => ({
        ...current,
        resume,
        resumeAiSnapshot: resume,
        generationInputKey,
        evaluationMarkdown: null,
        evaluationInputKey: null,
      }));
    },
    [],
  );

  const updateResume = useCallback((resume: GeneratedResume) => {
    setSession((current) => ({
      ...current,
      resume,
      evaluationMarkdown: null,
      evaluationInputKey: null,
    }));
  }, []);

  const setEvaluationResult = useCallback(
    (evaluationMarkdown: string, evaluationInputKey: string) => {
      setSession((current) => ({
        ...current,
        evaluationMarkdown,
        evaluationInputKey,
      }));
    },
    [],
  );

  const resetSession = useCallback(async (): Promise<{ error?: string }> => {
    allocationEpochRef.current += 1;
    await saveSnapshot();
    if (userId) {
      clearGenerateSessionLocalOverlay(userId);
      clearMeCache();
    }
    const res = await allocateNewGeneration();
    const started = res.data;
    const combine = seedCombineFromDefaults(EMPTY_COMBINE_SNAPSHOT, userId);
    setSession({
      ...EMPTY_GENERATE_SESSION,
      generationId: started?.id ?? null,
      generationPublicId: started?.publicId ?? null,
      combine,
    });
    if (!started) {
      return {
        error: res.error ?? "Failed to start a new generation.",
      };
    }
    return {};
  }, [saveSnapshot, userId]);

  const markFinalized = useCallback(() => {
    setSession((current) => {
      const next = { ...current, finalized: true };
      if (userId) {
        saveGenerateSessionLocalOverlay(userId, next.generationId, next);
      }
      return next;
    });
  }, [userId]);

  const dismissJobDuplicateCheck = useCallback((hash: string) => {
    setSession((current) => ({
      ...current,
      jobDuplicateDismissedHash: hash,
    }));
  }, []);

  const restoreSession = useCallback((next: GenerateSession) => {
    setSession(next);
  }, []);

  const clearJobAndPersist = useCallback(async () => {
    const snapshot = toGenerationSnapshot(session);
    if (!snapshot) {
      return { error: "Generation session is not ready." };
    }

    const nextSession = withoutResume({
      ...session,
      job: EMPTY_JOB_STATE,
      jobDuplicateDismissedHash: null,
      verdictInputKey: null,
    });
    setSession(nextSession);

    return persistGenerationSnapshot({
      ...snapshot,
      job: EMPTY_JOB_STATE,
    });
  }, [session]);

  return {
    ready,
    userId,
    generationId: session.generationId,
    generationPublicId: session.generationPublicId,
    activeStep: session.activeStep,
    setActiveStep,
    job: session.job,
    setJob,
    patchJob,
    combine: session.combine,
    setCombine,
    verdictInputKey: session.verdictInputKey,
    setVerdictResult,
    resume: session.resume,
    resumeAiSnapshot: session.resumeAiSnapshot,
    generationInputKey: session.generationInputKey,
    setResumeResult,
    updateResume,
    evaluationMarkdown: session.evaluationMarkdown,
    evaluationInputKey: session.evaluationInputKey,
    setEvaluationResult,
    clearDownstreamFromVerdictSession,
    clearDownstreamFromGenerateSession,
    saveSnapshot,
    resetSession,
    markFinalized,
    finalized: session.finalized,
    jobDuplicateDismissedHash: session.jobDuplicateDismissedHash,
    dismissJobDuplicateCheck,
    restoreSession,
    clearJobAndPersist,
  };
}
