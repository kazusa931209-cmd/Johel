"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import {
  ChoosePcewDialog,
  type PcewSelection,
} from "@/components/generate/ChoosePcewDialog";
import {
  applyNoiseFilter,
  JOB_ROLLBACK_MAX,
  JOB_TEXT_MAX,
} from "@/lib/jobNoiseFilter";

type InputMethod = "url" | "file" | "manual";

type GenerateJobStepProps = {
  pcew: PcewSelection | null;
  onPcewChange: (selection: PcewSelection) => void;
};

export function GenerateJobStep({ pcew, onPcewChange }: GenerateJobStepProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<InputMethod>("manual");
  const [url, setUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [fileError, setFileError] = useState<string | undefined>();
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
    const cleaned = applyNoiseFilter(jobText);
    if (cleaned === jobText) {
      toast("No noise to remove.", "info");
      return;
    }
    pushHistory(jobText);
    setJobTextCapped(cleaned);
    toast("Noise filter applied.", "success");
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

  function onLoadUrl() {
    toast("URL fetch will be available in a later phase.", "info");
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isText =
      file.type === "text/plain" ||
      file.type === "" ||
      file.name.toLowerCase().endsWith(".txt");
    if (!isText) {
      setFileError("Only plain text (.txt) files are supported in this phase.");
      return;
    }
    setFileError(undefined);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJobTextCapped(text);
      toast("File loaded.", "success");
    };
    reader.onerror = () => {
      setFileError("Failed to read the file.");
    };
    reader.readAsText(file);
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

      {method === "url" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label className="block min-w-0 flex-1 space-y-1 text-sm">
            <span>Job URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          </label>
          <button
            type="button"
            onClick={onLoadUrl}
            className="mt-0 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted sm:mt-6"
          >
            Load
          </button>
        </div>
      ) : null}

      {method === "file" ? (
        <div className="space-y-1 text-sm">
          <span className="block">Job file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={onFileChange}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-surface-muted"
          />
          {fileError ? <p className="text-sm text-danger">{fileError}</p> : null}
        </div>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span className="flex items-center justify-between gap-2">
          <span>Job Description</span>
          <span className="text-xs text-muted">
            {jobText.length}/{JOB_TEXT_MAX}
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
