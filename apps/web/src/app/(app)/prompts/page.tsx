"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import { PromptHelperDialog } from "@/components/PromptHelperDialog";
import { AddButton } from "@/components/shared/action-icon-buttons";
import { getPrompts, savePrompts, type PromptHelperKind } from "@/lib/api";
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

const PROMPT_FIELDS = [
  {
    kind: "verdict" as const,
    label: "Verdict Prompt",
    addLabel: "Add to Verdict Prompt",
    placeholder: VERDICT_PROMPT_PLACEHOLDER,
    rows: 12,
    stateKey: "verdictPrompt" as const,
  },
  {
    kind: "generate" as const,
    label: "Generate Prompt",
    addLabel: "Add to Generate Prompt",
    placeholder: GENERATE_PROMPT_PLACEHOLDER,
    rows: 48,
    stateKey: "generatePrompt" as const,
  },
  {
    kind: "evaluate" as const,
    label: "Evaluate Prompt",
    addLabel: "Add to Evaluate Prompt",
    placeholder: EVALUATE_PROMPT_PLACEHOLDER,
    rows: 16,
    stateKey: "evaluatePrompt" as const,
  },
];

export default function PromptsPage() {
  const { toast } = useToast();
  const [verdictPrompt, setVerdictPrompt] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [evaluatePrompt, setEvaluatePrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [helperKind, setHelperKind] = useState<PromptHelperKind | null>(null);

  const promptValues = {
    verdictPrompt,
    generatePrompt,
    evaluatePrompt,
  };

  const promptSetters = {
    verdictPrompt: setVerdictPrompt,
    generatePrompt: setGeneratePrompt,
    evaluatePrompt: setEvaluatePrompt,
  };

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

  const activeHelper = PROMPT_FIELDS.find((field) => field.kind === helperKind);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
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
        className="space-y-4 rounded-lg border border-border bg-surface p-4"
      >
        {PROMPT_FIELDS.map((field) => (
          <label key={field.kind} className="block space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>
                {field.label}
                <RequiredMark />
              </span>
              <AddButton
                label={field.addLabel}
                disabled={loading}
                onClick={() => setHelperKind(field.kind)}
              />
            </div>
            {loading ? (
              <p className="text-muted">Loading…</p>
            ) : (
              <textarea
                value={promptValues[field.stateKey]}
                onChange={(e) => {
                  promptSetters[field.stateKey](e.target.value);
                  if (fieldErrors[field.stateKey]) {
                    setFieldErrors((errors) => ({
                      ...errors,
                      [field.stateKey]: undefined,
                    }));
                  }
                }}
                placeholder={field.placeholder}
                rows={field.rows}
                aria-invalid={Boolean(fieldErrors[field.stateKey])}
                className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
              />
            )}
            <FieldError message={fieldErrors[field.stateKey]} />
          </label>
        ))}

        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      {activeHelper ? (
        <PromptHelperDialog
          kind={activeHelper.kind}
          fieldLabel={activeHelper.label}
          currentText={promptValues[activeHelper.stateKey]}
          onClose={() => setHelperKind(null)}
          onSuccess={(nextPrompt) => {
            promptSetters[activeHelper.stateKey](nextPrompt);
          }}
        />
      ) : null}
    </section>
  );
}
