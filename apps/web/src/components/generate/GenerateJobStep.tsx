"use client";

import { useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiFilterResultDialog } from "@/components/generate/AiFilterResultDialog";
import { formatThousandsSeparated } from "@/lib/helper";
import type { GenerateJobState } from "@/lib/generate-session";
import {
  JOB_ROLLBACK_MAX,
  JOB_TEXT_MAX,
  noiseFilter,
} from "@/lib/jobNoiseFilter";
import { runAiFilter, type AiFilterUsage } from "@/lib/api";

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

export function GenerateJobStep({
  job,
  onJobChange,
  onAdvanceToPcew,
}: GenerateJobStepProps) {
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const { method, jobText, history, acceptedMarkdown } = job;
  const [aiFiltering, setAiFiltering] = useState(false);
  const [aiResult, setAiResult] = useState<{
    markdown: string;
    usage: AiFilterUsage;
  } | null>(null);

  function updateJob(patch: Partial<GenerateJobState>) {
    onJobChange({ ...job, ...patch });
  }

  function setJobTextCapped(value: string) {
    updateJob({ jobText: value.slice(0, JOB_TEXT_MAX) });
  }

  function pushHistory(previous: string) {
    const next = [...history, previous];
    updateJob({
      history:
        next.length > JOB_ROLLBACK_MAX
          ? next.slice(next.length - JOB_ROLLBACK_MAX)
          : next,
    });
  }

  function onNoiseFilter() {
    const result = noiseFilter(jobText);
    if (result.text === jobText) {
      toast("No noise to remove.", "info");
      return;
    }
    pushHistory(jobText);
    setJobTextCapped(result.text);
    const pct = (result.reductionRate * 100).toFixed(1);
    toast(
      `Noise filter applied. Reduced ${pct}% (${formatThousandsSeparated(result.originalLength)} → ${formatThousandsSeparated(result.currentLength)} chars).`,
      "success",
    );
  }

  async function onAiFilter() {
    if (aiFiltering) return;
    const text = jobText.trim();
    if (!text) {
      toast("Enter a Job Description before running AI Filter.", "warning");
      return;
    }

    setAiFiltering(true);
    try {
      const res = await runAiFilter(text);
      if (!res.data) {
        toast(res.error ?? "AI Filter failed.", "error");
        return;
      }

      setAiResult({
        markdown: res.data.markdown,
        usage: res.data.usage,
      });
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast("AI Filter completed.", "success");
    } catch {
      toast("AI Filter failed.", "error");
    } finally {
      setAiFiltering(false);
    }
  }

  function onRollback() {
    if (history.length === 0) return;
    const next = [...history];
    const previous = next.pop();
    if (previous != null) {
      updateJob({ jobText: previous, history: next });
      toast("Rolled back to previous version.", "success");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Job</h2>

      {acceptedMarkdown ? (
        <p className="text-xs text-muted">
          AI Filter result accepted for this session. Continue in the PCEW step or
          edit the Job Description below.
        </p>
      ) : null}

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
              <span>Job Description</span>
              <span className="text-xs text-muted">
                {formatThousandsSeparated(jobText.length)}/
                {formatThousandsSeparated(JOB_TEXT_MAX)}
              </span>
            </span>
            <textarea
              value={jobText}
              onChange={(e) => setJobTextCapped(e.target.value)}
              rows={14}
              maxLength={JOB_TEXT_MAX}
              placeholder="Paste or enter the job description…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onNoiseFilter}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
            >
              Noise Filter
            </button>
            <button
              type="button"
              onClick={onAiFilter}
              disabled={aiFiltering}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
            >
              {aiFiltering ? "AI Filter…" : "AI Filter"}
            </button>
            <button
              type="button"
              onClick={onRollback}
              disabled={history.length === 0}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
            >
              Rollback{history.length > 0 ? ` (${history.length})` : ""}
            </button>
          </div>
        </>
      ) : null}

      {aiResult ? (
        <AiFilterResultDialog
          markdown={aiResult.markdown}
          usage={aiResult.usage}
          onClose={() => setAiResult(null)}
          onDiscard={() => {
            setAiResult(null);
            toast("AI Filter result discarded.", "info");
          }}
          onRetry={() => {
            setAiResult(null);
            void onAiFilter();
          }}
          onNext={() => {
            updateJob({ acceptedMarkdown: aiResult.markdown });
            setAiResult(null);
            toast("AI Filter result accepted.", "success");
            onAdvanceToPcew();
          }}
        />
      ) : null}

      {aiFiltering ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">Running AI Filter…</p>
            <p className="mt-1 text-xs text-muted">
              Please wait. Do not click AI Filter again.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
