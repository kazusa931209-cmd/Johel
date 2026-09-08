"use client";

import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { formatThousandsSeparated } from "@/lib/helper";
import {
  buildVerdictInputKey,
  canReuseStoredVerdict,
  type GenerateJobState,
} from "@/lib/generate-session";
import { JOB_TEXT_MAX, noiseFilter } from "@/lib/jobNoiseFilter";
import { runAiVerdict } from "@/lib/api";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

type GenerateJobStepProps = {
  job: GenerateJobState;
  verdictInputKey: string | null;
  verdictPrompt: string;
  doVerdict: boolean;
  onJobChange: (job: GenerateJobState) => void;
  onVerdictResult: (markdown: string, verdictInputKey: string) => void;
  onAdvanceToWorkflow: () => void | Promise<void>;
  onRunningChange?: (running: boolean) => void;
};

function ComingSoonAlert({ methodLabel }: { methodLabel: string }) {
  const t = useT();

  return (
    <div
      role="status"
      className="rounded-md border border-border bg-toast-info-bg px-3 py-3 text-sm text-toast-info-fg"
    >
      <p className="font-medium">
        {t("generate.job.comingSoon.notImplemented", { method: methodLabel })}
      </p>
      <p className="mt-1 opacity-90">{t("generate.job.comingSoon.soon")}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function GenerateJobStep({
  job,
  verdictInputKey,
  verdictPrompt,
  doVerdict,
  onJobChange,
  onVerdictResult,
  onAdvanceToWorkflow,
  onRunningChange,
}: GenerateJobStepProps) {
  const { toast } = useToast();
  const t = useT();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const { method, jobText } = job;
  const [running, setRunning] = useState(false);
  const [jobError, setJobError] = useState<string | undefined>();

  function updateJob(patch: Partial<GenerateJobState>) {
    onJobChange({ ...job, ...patch });
  }

  function setJobTextCapped(value: string) {
    updateJob({ jobText: value.slice(0, JOB_TEXT_MAX) });
  }

  const setRunningState = useCallback(
    (next: boolean) => {
      setRunning(next);
      onRunningChange?.(next);
    },
    [onRunningChange],
  );

  const onNext = useCallback(async () => {
    if (running) return;
    const text = jobText.trim();
    if (!text) {
      setJobError(t("validation.jobDescriptionRequired"));
      return;
    }
    setJobError(undefined);

    const filtered = noiseFilter(text).text;

    if (!doVerdict) {
      updateJob({ acceptedMarkdown: null });
      await onAdvanceToWorkflow();
      return;
    }

    const inputKey = buildVerdictInputKey(job, { verdictPrompt });
    if (canReuseStoredVerdict({ job, verdictInputKey }, inputKey)) {
      await onAdvanceToWorkflow();
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
      await onAdvanceToWorkflow();
    } catch {
      toast(t("toast.verdictFailed"), "error");
    } finally {
      setRunningState(false);
    }
  }, [
    doVerdict,
    job,
    jobText,
    onAdvanceToWorkflow,
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
    onNext: method === "manual" ? () => void onNext() : undefined,
    nextBusy: running,
  });

  const methodLabels = {
    manual: t("generate.job.methods.manual"),
    url: t("generate.job.methods.url"),
    file: t("generate.job.methods.fileUpload"),
  } as const;

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("generate.job.title")}
        </h2>

        <div className="flex flex-wrap gap-1 rounded-md border border-border p-1">
          {(
            [
              ["manual", methodLabels.manual],
              ["url", methodLabels.url],
              ["file", methodLabels.file],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => updateJob({ method: id })}
              className={`rounded-md px-3 py-1.5 text-sm ${
                method === id
                  ? "bg-surface-muted font-medium text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {method === "url" ? (
          <ComingSoonAlert methodLabel={methodLabels.url} />
        ) : null}
        {method === "file" ? (
          <ComingSoonAlert methodLabel={methodLabels.file} />
        ) : null}

        {method === "manual" ? (
          <label className="block space-y-1 text-sm">
            <span className="flex items-center justify-between gap-2">
              <span>
                {t("generate.job.jobDescription")}
                <span className="ml-0.5 text-danger" aria-hidden>*</span>
              </span>
              <span className="text-xs text-muted">
                {formatThousandsSeparated(jobText.length)}/
                {formatThousandsSeparated(JOB_TEXT_MAX)}
              </span>
            </span>
            <textarea
              value={jobText}
              onChange={(e) => {
                setJobTextCapped(e.target.value);
                if (jobError) setJobError(undefined);
              }}
              rows={24}
              maxLength={JOB_TEXT_MAX}
              placeholder={t("generate.job.placeholder")}
              aria-invalid={Boolean(jobError)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
            <FieldError message={jobError} />
          </label>
        ) : null}
      </div>

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
