"use client";

import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import {
  buildVerdictInputKey,
  canReuseStoredVerdict,
  type GenerateJobState,
} from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { runAiVerdict } from "@/lib/api";

type GenerateVerdictStepProps = {
  job: GenerateJobState;
  verdictInputKey: string | null;
  verdictPrompt: string;
  onVerdictResult: (markdown: string, verdictInputKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onRunningChange?: (running: boolean) => void;
};

export function GenerateVerdictStep({
  job,
  verdictInputKey,
  verdictPrompt,
  onVerdictResult,
  onPrev,
  onNext,
  onRunningChange,
}: GenerateVerdictStepProps) {
  const { toast } = useToast();
  const t = useT();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [running, setRunning] = useState(false);

  const setRunningState = useCallback(
    (next: boolean) => {
      setRunning(next);
      onRunningChange?.(next);
    },
    [onRunningChange],
  );

  const handleNext = useCallback(async () => {
    if (running) return;

    const filtered = noiseFilter(job.jobText.trim()).text;
    const inputKey = buildVerdictInputKey(job, { verdictPrompt });
    if (canReuseStoredVerdict({ job, verdictInputKey }, inputKey)) {
      onNext();
      return;
    }

    setRunningState(true);
    try {
      const res = await runAiVerdict(filtered);
      if (!res.data) {
        toast(res.error ?? t("toast.verdictFailed"), "error");
        return;
      }

      onVerdictResult(res.data.markdown, inputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.verdictCompleted"), "success");
      onNext();
    } catch {
      toast(t("toast.verdictFailed"), "error");
    } finally {
      setRunningState(false);
    }
  }, [
    job,
    onNext,
    onVerdictResult,
    refreshTokenUsed,
    running,
    setRunningState,
    setTokenUsed,
    t,
    toast,
    verdictInputKey,
    verdictPrompt,
  ]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: () => void handleNext(),
    nextBusy: running,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("generate.verdict.title")}
        </h2>
        <p className="text-sm text-muted">{t("generate.verdict.description")}</p>
      </div>

      {job.acceptedMarkdown ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("generate.verdict.result.title")}
          </h3>
          <p className="text-xs text-muted">
            {t("generate.verdict.result.description")}
          </p>
          <div className="rounded-md border border-border bg-background px-3 py-3">
            <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("generate.verdict.pending")}</p>
      )}

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
    </div>
  );
}
