"use client";

import { useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { formatThousandsSeparated } from "@/lib/helper";
import type { GenerateJobState } from "@/lib/generate-session";
import { JOB_TEXT_MAX, noiseFilter } from "@/lib/jobNoiseFilter";
import { runAiVerdict } from "@/lib/api";

type GenerateJobStepProps = {
  job: GenerateJobState;
  onJobChange: (job: GenerateJobState) => void;
  onAdvanceToPcew: () => void;
};

function ComingSoonAlert({ methodLabel }: { methodLabel: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-border bg-toast-info-bg px-3 py-3 text-sm text-toast-info-fg"
    >
      <p className="font-medium">{methodLabel} is not implemented yet.</p>
      <p className="mt-1 opacity-90">It’ll be coming soon…</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function GenerateJobStep({
  job,
  onJobChange,
  onAdvanceToPcew,
}: GenerateJobStepProps) {
  const { toast } = useToast();
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

  async function onNext() {
    if (running) return;
    const text = jobText.trim();
    if (!text) {
      setJobError("Job Description is required.");
      return;
    }
    setJobError(undefined);

    const filtered = noiseFilter(text).text;
    setRunning(true);
    try {
      const res = await runAiVerdict(filtered);
      if (!res.data) {
        toast(res.error ?? "AI Verdict failed.", "error");
        return;
      }

      updateJob({ acceptedMarkdown: res.data.markdown });
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast("AI Verdict completed.", "success");
      onAdvanceToPcew();
    } catch {
      toast("AI Verdict failed.", "error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Job</h2>

      <div className="flex flex-wrap gap-1 rounded-md border border-border p-1">
        {(
          [
            ["manual", "Manual"],
            ["url", "URL"],
            ["file", "File upload"],
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

      {method === "url" ? <ComingSoonAlert methodLabel="URL" /> : null}
      {method === "file" ? (
        <ComingSoonAlert methodLabel="File upload" />
      ) : null}

      {method === "manual" ? (
        <>
          <label className="block space-y-1 text-sm">
            <span className="flex items-center justify-between gap-2">
              <span>
                Job Description
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
              rows={14}
              maxLength={JOB_TEXT_MAX}
              placeholder="Paste or enter the job description…"
              aria-invalid={Boolean(jobError)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
            <FieldError message={jobError} />
          </label>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={() => void onNext()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
            >
              {running ? "Running AI Verdict…" : "Next"}
            </button>
          </div>
        </>
      ) : null}

      {running ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">Running AI Verdict…</p>
            <p className="mt-1 text-xs text-muted">
              Please wait. Noise filter and AI analysis are in progress.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
