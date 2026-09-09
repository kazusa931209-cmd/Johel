"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { getMe } from "@/lib/api";
import {
  clearDownstreamFromGenerate,
  clearDownstreamFromVerdict,
  EMPTY_GENERATE_SESSION,
  type GenerateJobState,
  type GenerateSession,
  clearGenerateSession,
  loadGenerateSession,
  saveGenerateSession,
} from "@/lib/generate-session";
import {
  allocateNewGeneration,
  persistGenerationSnapshot,
  type GenerationSnapshot,
} from "@/lib/generation-persistence";

function withoutResume(session: GenerateSession): GenerateSession {
  return {
    ...session,
    resume: null,
    generationInputKey: null,
    evaluationMarkdown: null,
    evaluationInputKey: null,
  };
}

function toGenerationSnapshot(
  session: GenerateSession,
  status?: GenerationSnapshot["status"],
): GenerationSnapshot | null {
  if (!session.generationId) return null;
  return {
    generationId: session.generationId,
    activeStep: session.activeStep,
    job: session.job,
    combine: session.combine,
    resume: session.resume,
    evaluationMarkdown: session.evaluationMarkdown,
    status,
  };
}

export function useGenerateSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GenerateSession>(EMPTY_GENERATE_SESSION);
  const startingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getMe().then((res) => {
      if (cancelled) return;
      const id = res.data?.id ?? null;
      setUserId(id);
      if (id) {
        const loaded = loadGenerateSession(id);
        if (loaded) setSession(loaded);
      }
      setReady(true);
    });
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
    let cancelled = false;
    void ensureGenerationStarted().then((started) => {
      if (cancelled || !started) return;
      setSession((current) => ({
        ...current,
        generationId: started.id,
        generationPublicId: started.publicId,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [ensureGenerationStarted, ready, session.generationId, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    saveGenerateSession(userId, session);
  }, [ready, session, userId]);

  const saveSnapshot = useCallback(
    async (status?: GenerationSnapshot["status"]) => {
      const snapshot = toGenerationSnapshot(session, status);
      if (!snapshot) return;
      await persistGenerationSnapshot(snapshot);
    },
    [session],
  );

  const setActiveStep = useCallback((activeStep: GenerateStep) => {
    setSession((current) => ({ ...current, activeStep }));
  }, []);

  const setJob = useCallback((job: GenerateJobState) => {
    setSession((current) => ({ ...current, job }));
  }, []);

  const patchJob = useCallback((patch: Partial<GenerateJobState>) => {
    setSession((current) => ({
      ...current,
      job: { ...current.job, ...patch },
    }));
  }, []);

  const setCombine = useCallback((combine: CombineSnapshot) => {
    setSession((current) => ({ ...current, combine }));
  }, []);

  const clearDownstreamFromVerdictSession = useCallback(() => {
    setSession((current) => clearDownstreamFromVerdict(current));
  }, []);

  const clearDownstreamFromGenerateSession = useCallback(() => {
    setSession((current) => clearDownstreamFromGenerate(current));
  }, []);

  const setVerdictResult = useCallback(
    (acceptedMarkdown: string, verdictInputKey: string) => {
      setSession((current) =>
        withoutResume({
          ...current,
          job: { ...current.job, acceptedMarkdown },
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
        generationInputKey,
        evaluationMarkdown: null,
        evaluationInputKey: null,
      }));
    },
    [],
  );

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

  const resetSession = useCallback(async () => {
    await saveSnapshot();
    if (userId) {
      clearGenerateSession(userId);
    }
    const started = await ensureGenerationStarted();
    setSession({
      ...EMPTY_GENERATE_SESSION,
      generationId: started?.id ?? null,
      generationPublicId: started?.publicId ?? null,
    });
  }, [ensureGenerationStarted, saveSnapshot, userId]);

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
    generationInputKey: session.generationInputKey,
    setResumeResult,
    evaluationMarkdown: session.evaluationMarkdown,
    evaluationInputKey: session.evaluationInputKey,
    setEvaluationResult,
    clearDownstreamFromVerdictSession,
    clearDownstreamFromGenerateSession,
    saveSnapshot,
    resetSession,
  };
}
