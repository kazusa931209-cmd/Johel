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
import {
  WORKSPACE_UPDATED_EVENT,
  type WorkspaceUpdatedDetail,
} from "@/lib/workspace-updated";

function withoutResume(session: GenerateSession): GenerateSession {
  return {
    ...session,
    resume: null,
    generationInputKey: null,
    evaluationMarkdown: null,
    evaluationInputKey: null,
  };
}

function applyJobUpdate(
  current: GenerateSession,
  job: GenerateJobState,
): GenerateSession {
  const jobTextChanged = job.jobText !== current.job.jobText;
  const nextJob = jobTextChanged
    ? { ...job, acceptedMarkdown: null }
    : job;
  return withoutResume({
    ...current,
    job: nextJob,
    verdictInputKey: jobTextChanged ? null : current.verdictInputKey,
    workflowRecommendInputKey: jobTextChanged
      ? null
      : current.workflowRecommendInputKey,
  });
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

  useEffect(() => {
    function onWorkspaceUpdated(event: Event) {
      const detail = (event as CustomEvent<WorkspaceUpdatedDetail>).detail;
      setSession((current) => {
        if (!current.resume && !current.evaluationMarkdown) {
          return current;
        }
        const sessionWorkflowId = current.workflow.workflowId;
        if (!sessionWorkflowId) {
          return withoutResume(current);
        }
        if (
          detail.workflowId === sessionWorkflowId ||
          detail.workflowId == null
        ) {
          return withoutResume(current);
        }
        return current;
      });
    }

    window.addEventListener(WORKSPACE_UPDATED_EVENT, onWorkspaceUpdated);
    return () => {
      window.removeEventListener(WORKSPACE_UPDATED_EVENT, onWorkspaceUpdated);
    };
  }, []);

  const setActiveStep = useCallback((activeStep: GenerateStep) => {
    setSession((current) => ({ ...current, activeStep }));
  }, []);

  const setJob = useCallback((job: GenerateJobState) => {
    setSession((current) => applyJobUpdate(current, job));
  }, []);

  const patchJob = useCallback((patch: Partial<GenerateJobState>) => {
    setSession((current) =>
      applyJobUpdate(current, { ...current.job, ...patch }),
    );
  }, []);

  const setWorkflow = useCallback((workflow: WorkflowSelection) => {
    setSession((current) => withoutResume({ ...current, workflow }));
  }, []);

  const setOneTimePrompt = useCallback((oneTimePrompt: string) => {
    setSession((current) => {
      if (oneTimePrompt === current.oneTimePrompt) {
        return current;
      }
      return withoutResume({ ...current, oneTimePrompt });
    });
  }, []);

  const setVerdictResult = useCallback(
    (acceptedMarkdown: string, verdictInputKey: string) => {
      setSession((current) =>
        withoutResume({
          ...current,
          job: { ...current.job, acceptedMarkdown },
          verdictInputKey,
          workflowRecommendInputKey: null,
        }),
      );
    },
    [],
  );

  const setWorkflowRecommendResult = useCallback(
    (workflow: WorkflowSelection, workflowRecommendInputKey: string) => {
      setSession((current) =>
        withoutResume({
          ...current,
          workflow,
          workflowRecommendInputKey,
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

  const resetSession = useCallback(() => {
    setSession(EMPTY_GENERATE_SESSION);
    if (userId) clearGenerateSession(userId);
  }, [userId]);

  return {
    ready,
    userId,
    activeStep: session.activeStep,
    setActiveStep,
    job: session.job,
    setJob,
    patchJob,
    workflow: session.workflow,
    setWorkflow,
    oneTimePrompt: session.oneTimePrompt,
    setOneTimePrompt,
    verdictInputKey: session.verdictInputKey,
    workflowRecommendInputKey: session.workflowRecommendInputKey,
    setVerdictResult,
    setWorkflowRecommendResult,
    resume: session.resume,
    generationInputKey: session.generationInputKey,
    setResumeResult,
    evaluationMarkdown: session.evaluationMarkdown,
    evaluationInputKey: session.evaluationInputKey,
    setEvaluationResult,
    resetSession,
  };
}
