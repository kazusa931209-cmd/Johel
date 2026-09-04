"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { WorkflowSelection } from "@/components/generate/pcew-types";
import { getMe } from "@/lib/api";
import {
  EMPTY_GENERATE_SESSION,
  type GenerateJobState,
  type GenerateSession,
  clearGenerateSession,
  loadGenerateSession,
  saveGenerateSession,
} from "@/lib/generate-session";

function withoutResume(session: GenerateSession): GenerateSession {
  return {
    ...session,
    resume: null,
    generationInputKey: null,
  };
}

export function useGenerateSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GenerateSession>(EMPTY_GENERATE_SESSION);

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

  useEffect(() => {
    if (!ready || !userId) return;
    saveGenerateSession(userId, session);
  }, [ready, session, userId]);

  const setActiveStep = useCallback((activeStep: GenerateStep) => {
    setSession((current) => ({ ...current, activeStep }));
  }, []);

  const setJob = useCallback((job: GenerateJobState) => {
    setSession((current) => withoutResume({ ...current, job }));
  }, []);

  const patchJob = useCallback((patch: Partial<GenerateJobState>) => {
    setSession((current) =>
      withoutResume({ ...current, job: { ...current.job, ...patch } }),
    );
  }, []);

  const setWorkflow = useCallback((workflow: WorkflowSelection) => {
    setSession((current) => withoutResume({ ...current, workflow }));
  }, []);

  const setResumeResult = useCallback(
    (resume: GeneratedResume, generationInputKey: string) => {
      setSession((current) => ({
        ...current,
        resume,
        generationInputKey,
      }));
    },
    [],
  );

  const resetSession = useCallback(() => {
    setSession(EMPTY_GENERATE_SESSION);
    if (userId) clearGenerateSession(userId);
  }, [userId]);

  return {
    ready,
    activeStep: session.activeStep,
    setActiveStep,
    job: session.job,
    setJob,
    patchJob,
    workflow: session.workflow,
    setWorkflow,
    resume: session.resume,
    generationInputKey: session.generationInputKey,
    setResumeResult,
    resetSession,
  };
}
