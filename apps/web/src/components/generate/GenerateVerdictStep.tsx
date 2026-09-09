"use client";

import { useCallback } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { GenerateVerdictPanelContent } from "@/components/generate/GenerateVerdictPanelContent";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useStepMountAutoRun } from "@/components/generate/useStepMountAutoRun";
import {
  buildVerdictInputKey,
  canReuseStoredVerdict,
  type GenerateJobState,
} from "@/lib/generate-session";
import {
  claimAutoRun,
  isAutoRunInFlight,
  releaseAutoRun,
} from "@/lib/generate-auto-run";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { runAiVerdict } from "@/lib/api";

type GenerateVerdictStepProps = {
  job: GenerateJobState;
  verdictInputKey: string | null;
  verdictPrompt: string;
  generationId?: string | null;
  onVerdictResult: (markdown: string, verdictInputKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  running: boolean;
  onRunningChange: (running: boolean) => void;
};

export function GenerateVerdictStep({
  job,
  verdictInputKey,
  verdictPrompt,
  generationId,
  onVerdictResult,
  onPrev,
  onNext,
  running,
  onRunningChange,
}: GenerateVerdictStepProps) {
  const { toast } = useToast();
  const t = useT();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();

  const setRunningState = useCallback(
    (next: boolean) => {
      onRunningChange(next);
    },
    [onRunningChange],
  );

  const runVerdict = useCallback(async () => {
    const filtered = noiseFilter(job.jobText.trim()).text;
    const inputKey = buildVerdictInputKey(job, { verdictPrompt });
    if (canReuseStoredVerdict({ job, verdictInputKey }, inputKey)) {
      return;
    }

    const autoRunKey = `verdict:${inputKey}`;
    if (!claimAutoRun(autoRunKey)) {
      if (isAutoRunInFlight(autoRunKey)) {
        setRunningState(true);
      }
      return;
    }

    setRunningState(true);
    try {
      const res = await runAiVerdict(filtered, generationId);
      if (!res.data) {
        toast(res.error ?? t("toast.verdictFailed"), "error");
        return;
      }

      onVerdictResult(res.data.markdown, inputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.verdictCompleted"), "success");
    } catch {
      toast(t("toast.verdictFailed"), "error");
    } finally {
      releaseAutoRun(autoRunKey);
      setRunningState(false);
    }
  }, [
    job,
    onVerdictResult,
    refreshTokenUsed,
    setRunningState,
    setTokenUsed,
    t,
    toast,
    generationId,
    verdictInputKey,
    verdictPrompt,
  ]);

  useStepMountAutoRun(runVerdict);

  useRegisterGenerateStepNav({
    onPrev,
    onNext:
      running || job.acceptedMarkdown
        ? () => {
            if (!running && job.acceptedMarkdown) {
              onNext();
            }
          }
        : undefined,
    nextBusy: running,
  });

  return (
    <>
      <GenerateVerdictPanelContent job={job} />

      {running ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.job.runningVerdict.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.job.runningVerdict.description")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
