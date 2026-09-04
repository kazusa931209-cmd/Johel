"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import { getVerdict, saveVerdict } from "@/lib/api";
import { VERDICT_PROMPT_PLACEHOLDER } from "@/lib/verdict";

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export default function VerdictPage() {
  const { toast } = useToast();
  const [verdictPrompt, setVerdictPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    getVerdict().then((res) => {
      if (cancelled) return;
      if (res.error) {
        toast(res.error ?? "Failed to load Verdict.", "error");
      } else if (res.data) {
        setVerdictPrompt(res.data.verdictPrompt);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!verdictPrompt.trim()) {
      setFieldError("Verdict Prompt is required.");
      return;
    }
    setFieldError(undefined);
    setSaving(true);
    const res = await saveVerdict(verdictPrompt.trim());
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed.", "error");
      return;
    }
    setVerdictPrompt(res.data.verdictPrompt);
    toast("Verdict saved.", "success");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Verdict</h1>
        <p className="text-muted">
          Configure the Verdict Prompt used when checking Job Descriptions.
        </p>
      </div>
      <form
        noValidate
        onSubmit={onSave}
        className="max-w-2xl space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <label className="block space-y-1 text-sm">
          <span>
            Verdict Prompt
            <RequiredMark />
          </span>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <textarea
              value={verdictPrompt}
              onChange={(e) => {
                setVerdictPrompt(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              placeholder={VERDICT_PROMPT_PLACEHOLDER}
              rows={8}
              aria-invalid={Boolean(fieldError)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          )}
          <FieldError message={fieldError} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
