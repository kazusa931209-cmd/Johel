"use client";

import { useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import {
  ChoosePcewDialog,
  type PcewSelection,
} from "@/components/generate/ChoosePcewDialog";
import { formatThousandsSeparated } from "@/lib/helper";
import {
  JOB_ROLLBACK_MAX,
  JOB_TEXT_MAX,
  noiseFilter,
} from "@/lib/jobNoiseFilter";

type InputMethod = "url" | "file" | "manual";

type GenerateJobStepProps = {
  pcew: PcewSelection | null;
  onPcewChange: (selection: PcewSelection) => void;
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

export function GenerateJobStep({ pcew, onPcewChange }: GenerateJobStepProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<InputMethod>("manual");
  const [jobText, setJobText] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [pcewOpen, setPcewOpen] = useState(false);

  function setJobTextCapped(value: string) {
    setJobText(value.slice(0, JOB_TEXT_MAX));
  }

  function pushHistory(previous: string) {
    setHistory((current) => {
      const next = [...current, previous];
      if (next.length > JOB_ROLLBACK_MAX) {
        return next.slice(next.length - JOB_ROLLBACK_MAX);
      }
      return next;
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

  function onAiFilter() {
    toast("AI Filter will be available in a later phase.", "info");
  }

  function onRollback() {
    setHistory((current) => {
      if (current.length === 0) return current;
      const next = [...current];
      const previous = next.pop();
      if (previous != null) {
        setJobText(previous);
        toast("Rolled back to previous version.", "success");
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Job</h2>
        <button
          type="button"
          onClick={() => setPcewOpen(true)}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Choose PCEW
        </button>
      </div>

      {pcew ? (
        <p className="text-xs text-muted">
          PCEW selected (local only). Profile, Company, Experience, and Workflow
          IDs are stored for this session.
        </p>
      ) : (
        <p className="text-xs text-muted">
          Choose Profile, Company, Experience, and Workflow when ready.
        </p>
      )}

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
            onClick={() => setMethod(id)}
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
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
            >
              AI Filter
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

      {pcewOpen ? (
        <ChoosePcewDialog
          initial={pcew}
          onClose={() => setPcewOpen(false)}
          onApply={(selection) => {
            onPcewChange(selection);
            setPcewOpen(false);
            toast("PCEW selection applied.", "success");
          }}
        />
      ) : null}
    </div>
  );
}
