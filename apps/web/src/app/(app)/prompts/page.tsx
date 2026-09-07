"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { PromptEditDialog } from "@/components/PromptEditDialog";
import { EditButton } from "@/components/shared/action-icon-buttons";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { getPrompts, savePrompts } from "@/lib/api";
import {
  AUTO_MARKDOWN_FORMAT_HINT,
  needsMarkdownFormatOnSave,
} from "@/lib/markdown-format";
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

type PromptStateKey = keyof FieldErrors;

const PROMPT_FIELDS = [
  {
    label: "Verdict Prompt",
    editLabel: "Edit Verdict Prompt",
    placeholder: VERDICT_PROMPT_PLACEHOLDER,
    rows: 12,
    stateKey: "verdictPrompt" as const,
  },
  {
    label: "Generate Prompt",
    editLabel: "Edit Generate Prompt",
    placeholder: GENERATE_PROMPT_PLACEHOLDER,
    rows: 48,
    stateKey: "generatePrompt" as const,
  },
  {
    label: "Evaluate Prompt",
    editLabel: "Edit Evaluate Prompt",
    placeholder: EVALUATE_PROMPT_PLACEHOLDER,
    rows: 16,
    stateKey: "evaluatePrompt" as const,
  },
];

export default function PromptsPage() {
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const [verdictPrompt, setVerdictPrompt] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [evaluatePrompt, setEvaluatePrompt] = useState("");
  const [storedVerdictPrompt, setStoredVerdictPrompt] = useState("");
  const [storedGeneratePrompt, setStoredGeneratePrompt] = useState("");
  const [storedEvaluatePrompt, setStoredEvaluatePrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [editingField, setEditingField] = useState<PromptStateKey | null>(null);

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
        setStoredVerdictPrompt(res.data.verdictPrompt);
        setStoredGeneratePrompt(res.data.generatePrompt);
        setStoredEvaluatePrompt(res.data.evaluatePrompt);
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
    setStoredVerdictPrompt(res.data.verdictPrompt);
    setStoredGeneratePrompt(res.data.generatePrompt);
    setStoredEvaluatePrompt(res.data.evaluatePrompt);
    await refreshTokenUsed();
    toast("Prompts saved.", "success");
  }

  const activeEdit = PROMPT_FIELDS.find(
    (field) => field.stateKey === editingField,
  );

  const converting =
    saving &&
    (needsMarkdownFormatOnSave(verdictPrompt, storedVerdictPrompt) ||
      needsMarkdownFormatOnSave(generatePrompt, storedGeneratePrompt) ||
      needsMarkdownFormatOnSave(evaluatePrompt, storedEvaluatePrompt));

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
          <div key={field.stateKey} className="block space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>
                {field.label}
                <RequiredMark />
              </span>
              <EditButton
                label={field.editLabel}
                disabled={loading}
                onClick={() => setEditingField(field.stateKey)}
              />
            </div>
            {loading ? (
              <p className="text-muted">Loading…</p>
            ) : (
              <div
                className="min-h-16 rounded-md border border-border bg-background px-3 py-2"
                aria-invalid={Boolean(fieldErrors[field.stateKey])}
              >
                {promptValues[field.stateKey].trim() ? (
                  <AiVerdictMarkdown markdown={promptValues[field.stateKey]} />
                ) : (
                  <p className="text-muted">{field.placeholder}</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
            <FieldError message={fieldErrors[field.stateKey]} />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      {activeEdit ? (
        <PromptEditDialog
          title={`Edit ${activeEdit.label}`}
          value={promptValues[activeEdit.stateKey]}
          rows={activeEdit.rows}
          placeholder={activeEdit.placeholder}
          onClose={() => setEditingField(null)}
          onApply={(nextValue) => {
            promptSetters[activeEdit.stateKey](nextValue);
            setFieldErrors((errors) => ({
              ...errors,
              [activeEdit.stateKey]: undefined,
            }));
          }}
        />
      ) : null}

      {converting ? (
        <BusyOverlay
          title="Converting to markdown…"
          description="Please wait while your prompts are formatted."
        />
      ) : null}
    </section>
  );
}
