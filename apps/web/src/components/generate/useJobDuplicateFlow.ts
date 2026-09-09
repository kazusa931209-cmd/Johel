"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  buildJobDuplicateCheckHash,
  type GenerateJobState,
  type GenerateSession,
} from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { checkJobDuplicate, type JobDuplicateMatch } from "@/lib/api";
import { resumeGenerationFromHistory } from "@/lib/generation-persistence";

type ToastFn = (message: string, kind: "success" | "error") => void;

type UseJobDuplicateFlowOptions = {
  generationId: string | null;
  userId: string | null;
  job: GenerateJobState;
  jobDuplicateDismissedHash: string | null;
  dismissJobDuplicateCheck: (hash: string) => void;
  restoreSession: (session: GenerateSession) => void;
  setActiveStep: (step: GenerateStep) => void;
  saveSnapshot: () => Promise<{ error?: string } | void>;
  clearJobAndPersist: () => Promise<{ error?: string } | void>;
  proceedToVerdict: () => Promise<void>;
  toast: ToastFn;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function useJobDuplicateFlow({
  generationId,
  userId,
  job,
  jobDuplicateDismissedHash,
  dismissJobDuplicateCheck,
  restoreSession,
  setActiveStep,
  saveSnapshot,
  clearJobAndPersist,
  proceedToVerdict,
  toast,
  t,
}: UseJobDuplicateFlowOptions) {
  const [checking, setChecking] = useState(false);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [match, setMatch] = useState<JobDuplicateMatch | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingHashRef = useRef<string | null>(null);

  const newFilteredJobText = noiseFilter(job.jobText.trim()).text;

  const closeDialog = useCallback(() => {
    if (dialogBusy) return;
    setDialogOpen(false);
    setMatch(null);
    pendingHashRef.current = null;
  }, [dialogBusy]);

  const clearJobInputAndPersist = useCallback(async () => {
    const saveRes = await clearJobAndPersist();
    if (saveRes && "error" in saveRes && saveRes.error) {
      toast(saveRes.error ?? t("toast.generationSaveFailed"), "error");
      return false;
    }
    return true;
  }, [clearJobAndPersist, t, toast]);

  const checkBeforeVerdict = useCallback(async (): Promise<boolean> => {
    if (!generationId) {
      return true;
    }

    const hash = buildJobDuplicateCheckHash(job.jobText);
    if (jobDuplicateDismissedHash === hash) {
      return true;
    }

    setChecking(true);
    try {
      const saveRes = await saveSnapshot();
      if (saveRes && "error" in saveRes && saveRes.error) {
        toast(saveRes.error ?? t("toast.generationSaveFailed"), "error");
        return false;
      }

      const res = await checkJobDuplicate(generationId);
      if (res.error) {
        toast(res.error ?? t("toast.jobDuplicateCheckFailed"), "error");
        return true;
      }

      if (!res.data?.match) {
        return true;
      }

      pendingHashRef.current = hash;
      setMatch(res.data.match);
      setDialogOpen(true);
      return false;
    } catch {
      toast(t("toast.jobDuplicateCheckFailed"), "error");
      return true;
    } finally {
      setChecking(false);
    }
  }, [
    generationId,
    job.jobText,
    jobDuplicateDismissedHash,
    saveSnapshot,
    t,
    toast,
  ]);

  const handleContinue = useCallback(async () => {
    const hash = pendingHashRef.current;
    setDialogBusy(true);
    try {
      if (hash) {
        dismissJobDuplicateCheck(hash);
      }
      setDialogOpen(false);
      setMatch(null);
      pendingHashRef.current = null;
      await proceedToVerdict();
    } finally {
      setDialogBusy(false);
    }
  }, [dismissJobDuplicateCheck, proceedToVerdict]);

  const handleCancel = useCallback(async () => {
    setDialogBusy(true);
    try {
      const saved = await clearJobInputAndPersist();
      closeDialog();
      if (saved) {
        setActiveStep("Job");
      }
    } finally {
      setDialogBusy(false);
    }
  }, [clearJobInputAndPersist, closeDialog, setActiveStep]);

  const handleSwitch = useCallback(async () => {
    if (!match || !userId) {
      return;
    }

    setDialogBusy(true);
    try {
      const saved = await clearJobInputAndPersist();
      if (!saved) {
        return;
      }

      const result = await resumeGenerationFromHistory(match.publicId, userId);
      if (result.error || !result.session) {
        toast(result.error ?? t("toast.generationResumeFailed"), "error");
        return;
      }

      restoreSession(result.session);
      closeDialog();
      toast(t("toast.generationResumed"), "success");
    } finally {
      setDialogBusy(false);
    }
  }, [
    clearJobInputAndPersist,
    closeDialog,
    match,
    restoreSession,
    t,
    toast,
    userId,
  ]);

  return {
    checking,
    dialogBusy,
    dialogOpen,
    match,
    newFilteredJobText,
    checkBeforeVerdict,
    closeDialog,
    handleCancel,
    handleContinue,
    handleSwitch,
  };
}
