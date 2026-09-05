"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import { getPrompts, savePrompts } from "@/lib/api";
import {
  EVALUATE_PROMPT_PLACEHOLDER,
  GENERATE_PROMPT_PLACEHOLDER,
  VERDICT_PROMPT_PLACEHOLDER,
} from "@/lib/prompts";

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

type FieldErrors = {
  verdictPrompt?: string;
  generatePrompt?: string;
  evaluatePrompt?: string;
};

export default function PromptsPage() {
  const { toast } = useToast();
  const [verdictPrompt, setVerdictPrompt] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [evaluatePrompt, setEvaluatePrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;
    getPrompts().then((res) => {
      if (cancelled) return;
      if (res.error) {
        toast(res.error ?? "Failed to load prompts.", "error");
      } else if (res.data) {
        setVerdictPrompt(res.data.verdictPrompt);
        setGeneratePrompt(res.data.generatePrompt);
        setEvaluatePrompt(res.data.evaluatePrompt);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!verdictPrompt.trim()) {
      nextErrors.verdictPrompt = "Verdict Prompt is required.";
    }
    if (!generatePrompt.trim()) {
      nextErrors.generatePrompt = "Generate Prompt is required.";
    }
    if (!evaluatePrompt.trim()) {
      nextErrors.evaluatePrompt = "Evaluate Prompt is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    const res = await savePrompts({
      verdictPrompt: verdictPrompt.trim(),
      generatePrompt: generatePrompt.trim(),
      evaluatePrompt: evaluatePrompt.trim(),
    });
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed.", "error");
      return;
    }
    setVerdictPrompt(res.data.verdictPrompt);
    setGeneratePrompt(res.data.generatePrompt);
    setEvaluatePrompt(res.data.evaluatePrompt);
    toast("Prompts saved.", "success");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
        <p className="text-muted">
          Configure prompts used when checking Job Descriptions, generating
          résumés, and evaluating résumés.
        </p>
      </div>
      <form
        noValidate
        onSubmit={onSave}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-4"
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
                if (fieldErrors.verdictPrompt) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    verdictPrompt: undefined,
                  }));
                }
              }}
              placeholder={VERDICT_PROMPT_PLACEHOLDER}
              rows={8}
              aria-invalid={Boolean(fieldErrors.verdictPrompt)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          )}
          <FieldError message={fieldErrors.verdictPrompt} />
        </label>

        <label className="block space-y-1 text-sm">
          <span>
            Generate Prompt
            <RequiredMark />
          </span>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <textarea
              value={generatePrompt}
              onChange={(e) => {
                setGeneratePrompt(e.target.value);
                if (fieldErrors.generatePrompt) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    generatePrompt: undefined,
                  }));
                }
              }}
              placeholder={GENERATE_PROMPT_PLACEHOLDER}
              rows={8}
              aria-invalid={Boolean(fieldErrors.generatePrompt)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          )}
          <FieldError message={fieldErrors.generatePrompt} />
        </label>

        <label className="block space-y-1 text-sm">
          <span>
            Evaluate Prompt
            <RequiredMark />
          </span>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <textarea
              value={evaluatePrompt}
              onChange={(e) => {
                setEvaluatePrompt(e.target.value);
                if (fieldErrors.evaluatePrompt) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    evaluatePrompt: undefined,
                  }));
                }
              }}
              placeholder={EVALUATE_PROMPT_PLACEHOLDER}
              rows={8}
              aria-invalid={Boolean(fieldErrors.evaluatePrompt)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          )}
          <FieldError message={fieldErrors.evaluatePrompt} />
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
