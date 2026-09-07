"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { PromptEditDialog } from "@/components/PromptEditDialog";
import { EditButton } from "@/components/shared/action-icon-buttons";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { getPrompts, savePrompt, type PromptKind } from "@/lib/api";
import {
  AUTO_MARKDOWN_FORMAT_HINT,
  needsMarkdownFormatOnSave,
} from "@/lib/markdown-format";
import {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_VERDICT_PROMPT,
  EVALUATE_PROMPT_PLACEHOLDER,
  GENERATE_PROMPT_JOB_CONTEXT_HINT,
  GENERATE_PROMPT_PLACEHOLDER,
  EVALUATE_PROMPT_JOB_HINT,
  SYSTEM_PROMPT_QUALITY_NOTICE,
  VERDICT_PROMPT_PLACEHOLDER,
  VERDICT_PROMPT_RESUME_HINT,
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

type PromptTab = PromptKind;

type PromptFieldConfig = {
  kind: PromptTab;
  label: string;
  editLabel: string;
  placeholder: string;
  resumeHint?: string;
  rows: number;
};

const PROMPT_TABS: PromptFieldConfig[] = [
  {
    kind: "verdict",
    label: "Verdict Prompt",
    editLabel: "Edit Verdict Prompt",
    placeholder: VERDICT_PROMPT_PLACEHOLDER,
    resumeHint: VERDICT_PROMPT_RESUME_HINT,
    rows: 24,
  },
  {
    kind: "generate",
    label: "Generate Prompt",
    editLabel: "Edit Generate Prompt",
    placeholder: GENERATE_PROMPT_PLACEHOLDER,
    resumeHint: GENERATE_PROMPT_JOB_CONTEXT_HINT,
    rows: 24,
  },
  {
    kind: "evaluate",
    label: "Evaluate Prompt",
    editLabel: "Edit Evaluate Prompt",
    placeholder: EVALUATE_PROMPT_PLACEHOLDER,
    resumeHint: EVALUATE_PROMPT_JOB_HINT,
    rows: 24,
  },
];

const PROMPT_TAB_IDS = new Set(PROMPT_TABS.map((tab) => tab.kind));

const DEFAULT_PROMPT_BY_KIND: Record<PromptTab, string> = {
  verdict: DEFAULT_VERDICT_PROMPT,
  generate: DEFAULT_GENERATE_PROMPT,
  evaluate: DEFAULT_EVALUATE_PROMPT,
};

function parsePromptTab(value: string | null): PromptTab {
  if (value && PROMPT_TAB_IDS.has(value as PromptTab)) {
    return value as PromptTab;
  }
  return "verdict";
}

function promptValueKey(kind: PromptTab): keyof PromptValues {
  return `${kind}Prompt`;
}

type PromptValues = {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
};

type StoredPromptValues = PromptValues;

const EMPTY_PROMPTS: PromptValues = {
  verdictPrompt: "",
  generatePrompt: "",
  evaluatePrompt: "",
};

export default function PromptsPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-3xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
            <p className="text-muted">Loading…</p>
          </div>
        </section>
      }
    >
      <PromptsPageContent />
    </Suspense>
  );
}

function PromptsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const activeTab = parsePromptTab(searchParams.get("tab"));
  const activeField = PROMPT_TABS.find((tab) => tab.kind === activeTab)!;

  const [prompts, setPrompts] = useState<PromptValues>(EMPTY_PROMPTS);
  const [storedPrompts, setStoredPrompts] =
    useState<StoredPromptValues>(EMPTY_PROMPTS);
  const [loading, setLoading] = useState(true);
  const [savingKind, setSavingKind] = useState<PromptTab | null>(null);
  const [resettingKind, setResettingKind] = useState<PromptTab | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);

  const valueKey = promptValueKey(activeTab);
  const storedKey = promptValueKey(activeTab);
  const activeValue = prompts[valueKey];
  const activeStored = storedPrompts[storedKey];

  useEffect(() => {
    let cancelled = false;
    getPrompts().then((res) => {
      if (cancelled) return;
      if (res.error) {
        toast(res.error ?? "Failed to load prompts.", "error");
      } else if (res.data) {
        setPrompts(res.data);
        setStoredPrompts(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    setFieldError(undefined);
    setEditing(false);
    setConfirmReset(false);
  }, [activeTab]);

  function setActiveTab(tab: PromptTab) {
    router.replace(`/settings/prompts?tab=${tab}`, { scroll: false });
  }

  function setActivePrompt(nextValue: string) {
    setPrompts((current) => ({
      ...current,
      [valueKey]: nextValue,
    }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!activeValue.trim()) {
      setFieldError(`${activeField.label} is required.`);
      return;
    }
    setFieldError(undefined);

    setSavingKind(activeTab);
    const res = await savePrompt(activeTab, activeValue.trim());
    setSavingKind(null);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed.", "error");
      return;
    }
    setPrompts(res.data);
    setStoredPrompts(res.data);
    await refreshTokenUsed();
    toast(`${activeField.label} saved.`, "success");
  }

  async function onConfirmReset() {
    setResettingKind(activeTab);
    const res = await savePrompt(activeTab, DEFAULT_PROMPT_BY_KIND[activeTab]);
    setResettingKind(null);
    if (res.error || !res.data) {
      toast(res.error ?? "Reset failed.", "error");
      return;
    }
    setPrompts(res.data);
    setStoredPrompts(res.data);
    setConfirmReset(false);
    await refreshTokenUsed();
    toast(`${activeField.label} reset to default.`, "success");
  }

  const converting =
    (savingKind === activeTab || resettingKind === activeTab) &&
    needsMarkdownFormatOnSave(
      savingKind === activeTab ? activeValue : DEFAULT_PROMPT_BY_KIND[activeTab],
      activeStored,
    );
  const resetBusy = resettingKind === activeTab;
  const saveBusy = savingKind === activeTab;
  const actionBusy = saveBusy || resetBusy;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
        <p className="text-muted">
          Configure system prompts used when checking Job Descriptions,
          generating résumés, and evaluating résumés. Each tab saves
          independently.
        </p>
        <p className="text-sm text-foreground">{SYSTEM_PROMPT_QUALITY_NOTICE}</p>
      </div>

      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Prompt types"
      >
        {PROMPT_TABS.map((tab) => {
          const selected = activeTab === tab.kind;
          return (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              id={`prompts-tab-${tab.kind}`}
              aria-selected={selected}
              aria-controls={`prompts-panel-${tab.kind}`}
              className={[
                "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border border-b-0 border-border bg-surface text-foreground"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
              onClick={() => setActiveTab(tab.kind)}
            >
              {tab.label.replace(" Prompt", "")}
            </button>
          );
        })}
      </div>

      <form
        noValidate
        onSubmit={onSave}
        className="space-y-4 rounded-lg rounded-tl-none border border-border bg-surface p-4"
      >
        <div
          id={`prompts-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`prompts-tab-${activeTab}`}
          className="block space-y-1 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span>
              {activeField.label}
              <RequiredMark />
            </span>
            <EditButton
              label={activeField.editLabel}
              disabled={loading}
              onClick={() => setEditing(true)}
            />
          </div>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <div
              className="min-h-16 rounded-md border border-border bg-background px-3 py-2"
              aria-invalid={Boolean(fieldError)}
            >
              {activeValue.trim() ? (
                <AiVerdictMarkdown markdown={activeValue} />
              ) : (
                <p className="text-muted">{activeField.placeholder}</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
          {activeField.resumeHint ? (
            <p className="text-xs text-muted">{activeField.resumeHint}</p>
          ) : null}
          <FieldError message={fieldError} />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={loading || actionBusy}
            onClick={() => setConfirmReset(true)}
            className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground hover:opacity-90 disabled:opacity-60"
          >
            Reset to Default
          </button>
          <button
            type="submit"
            disabled={actionBusy}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {saveBusy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {confirmReset ? (
        <DetailDialog
          title="Reset to default"
          role="alertdialog"
          closeDisabled={resetBusy}
          onClose={() => setConfirmReset(false)}
        >
          <p className="text-muted">
            Reset {activeField.label} to the default template? Your current
            text will be replaced.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={resetBusy}
              onClick={() => void onConfirmReset()}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {resetBusy ? "Resetting…" : "Reset to Default"}
            </button>
          </div>
        </DetailDialog>
      ) : null}

      {editing ? (
        <PromptEditDialog
          title={`Edit ${activeField.label}`}
          value={activeValue}
          rows={activeField.rows}
          placeholder={activeField.placeholder}
          onClose={() => setEditing(false)}
          onApply={(nextValue) => {
            setActivePrompt(nextValue);
            setFieldError(undefined);
          }}
        />
      ) : null}

      {converting ? (
        <BusyOverlay
          title={resetBusy ? "Resetting to default…" : "Converting to markdown…"}
          description={
            resetBusy
              ? "Please wait while the default prompt is saved."
              : "Please wait while your prompt is formatted."
          }
        />
      ) : null}
    </section>
  );
}
