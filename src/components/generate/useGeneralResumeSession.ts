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
  EMPTY_GENERATE_SESSION,
  EMPTY_JOB_STATE,
  type GenerateSession,
} from "@/lib/generate-session";
import {
  allocateNewGeneralResume,
  fetchCurrentGeneralResumeSession,
  persistGeneralResumeSnapshot,
  persistGeneralResumeSnapshotKeepalive,
  type GeneralResumeSnapshot,
} from "@/lib/general-resume-persistence";
import {
  persistCombineDefaultsFromSnapshot,
  seedCombineFromDefaults,
} from "@/lib/combine-defaults";
import { usePersistSnapshotOnLeave } from "@/lib/use-persist-snapshot-on-leave";

function toSnapshot(
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

const INITIAL_SESSION: GenerateSession = {
  ...EMPTY_GENERATE_SESSION,
  activeStep: "Combine",
  job: EMPTY_JOB_STATE,
};

export function useGeneralResumeSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GenerateSession>(INITIAL_SESSION);
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

      const restored = await fetchCurrentGeneralResumeSession();
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
      const res = await allocateNewGeneralResume();
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

  const saveSnapshot = useCallback(async (finalized?: boolean) => {
    const snapshot = toSnapshot(sessionRef.current, finalized);
    if (!snapshot) {
      return { error: "General resume session is not ready." };
    }
    return persistGeneralResumeSnapshot(snapshot);
  }, []);

  const setActiveStep = useCallback((activeStep: GenerateStep) => {
    setSession((current) => ({ ...current, activeStep }));
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

  const clearDownstreamFromGenerateSession = useCallback(() => {
    setSession((current) => clearDownstreamFromGenerate(current));
  }, []);

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
    await saveSnapshot(true);
    if (userId) {
      clearMeCache();
    }
    const res = await allocateNewGeneralResume();
    const started = res.data;
    const combine = seedCombineFromDefaults(EMPTY_COMBINE_SNAPSHOT, userId);
    setSession({
      ...INITIAL_SESSION,
      generationId: started?.id ?? null,
      generationPublicId: started?.publicId ?? null,
      combine,
    });
    if (!started) {
      return {
        error: res.error ?? "Failed to start a new general resume.",
      };
    }
    return {};
  }, [saveSnapshot, userId]);

  const restoreSession = useCallback((next: GenerateSession) => {
    setSession(next);
  }, []);

  const markFinalized = useCallback(() => {
    setSession((current) => ({ ...current, finalized: true }));
  }, []);

  const saveKeepalive = useCallback(() => {
    const snapshot = toSnapshot(sessionRef.current);
    if (!snapshot) return;
    persistGeneralResumeSnapshotKeepalive(snapshot);
  }, []);

  usePersistSnapshotOnLeave({
    enabled: ready && Boolean(session.generationId),
    saveSnapshot,
    saveKeepalive,
  });

  return {
    ready,
    userId,
    generationId: session.generationId,
    generationPublicId: session.generationPublicId,
    activeStep: session.activeStep,
    setActiveStep,
    combine: session.combine,
    setCombine,
    resume: session.resume,
    resumeAiSnapshot: session.resumeAiSnapshot,
    setResumeResult,
    updateResume,
    evaluationMarkdown: session.evaluationMarkdown,
    setEvaluationResult,
    clearDownstreamFromGenerateSession,
    generationInputKey: session.generationInputKey,
    evaluationInputKey: session.evaluationInputKey,
    saveSnapshot,
    resetSession,
    markFinalized,
    finalized: session.finalized,
    restoreSession,
    job: session.job,
  };
}
