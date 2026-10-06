"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { PromptEditDialog } from "@/components/PromptEditDialog";
import { EditButton } from "@/components/shared/action-icon-buttons";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { savePromptTab, type PromptKind } from "@/lib/api";
import { loadPrompts, setPromptsCache } from "@/lib/cached-settings";
import { needsMarkdownFormatOnSave } from "@/lib/markdown-format";
import {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERAL_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_REFINE_PROMPT,
  DEFAULT_VERDICT_PROMPT,
  getAutoMarkdownFormatHint,
  getEvaluatePromptJobHint,
  getEvaluatePromptPlaceholder,
  getGeneralEvaluatePromptPlaceholder,
  getGeneralEvaluatePromptResumeHint,
  getGeneratePromptJobContextHint,
  getGeneratePromptPlaceholder,
  getPromptEditLabel,
  getPromptFieldLabel,
  getPromptTabLabel,
  getRefinePromptPlaceholder,
  getRefinePromptResumeHint,
  getSystemPromptQualityNotice,
  getVerdictPromptPlaceholder,
  getVerdictPromptResumeHint,
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
  rows: number;
};

const PROMPT_TAB_CONFIGS: PromptFieldConfig[] = [
  { kind: "verdict", rows: 24 },
  { kind: "generate", rows: 24 },
  { kind: "evaluate", rows: 24 },
  { kind: "refine", rows: 24 },
  { kind: "generalEvaluate", rows: 24 },
];

const PROMPT_TAB_IDS = new Set(PROMPT_TAB_CONFIGS.map((tab) => tab.kind));

const DEFAULT_PROMPT_BY_KIND: Record<PromptTab, string> = {
  verdict: DEFAULT_VERDICT_PROMPT,
  generate: DEFAULT_GENERATE_PROMPT,
  evaluate: DEFAULT_EVALUATE_PROMPT,
  refine: DEFAULT_REFINE_PROMPT,
  generalEvaluate: DEFAULT_GENERAL_EVALUATE_PROMPT,
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

function extensionValueKey(kind: PromptTab): keyof PromptValues {
  return `${kind}Extension`;
}

type PromptValues = {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  refinePrompt: string;
  generalEvaluatePrompt: string;
  verdictExtension: string;
  generateExtension: string;
  evaluateExtension: string;
  refineExtension: string;
  generalEvaluateExtension: string;
};

type StoredPromptValues = PromptValues;

const EMPTY_PROMPTS: PromptValues = {
  verdictPrompt: "",
  generatePrompt: "",
  evaluatePrompt: "",
  refinePrompt: "",
  generalEvaluatePrompt: "",
  verdictExtension: "",
  generateExtension: "",
  evaluateExtension: "",
  refineExtension: "",
  generalEvaluateExtension: "",
};

function PromptsPageFallback() {
  const t = useT();

  return (
    <section className="w-full space-y-6">
      <p className="text-muted">{t("settings.prompts.loading")}</p>
    </section>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<PromptsPageFallback />}>
      <PromptsPageContent />
    </Suspense>
  );
}

function PromptsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useT();
  const { refreshTokenUsed } = useAiUsage();
  const activeTab = parsePromptTab(searchParams.get("tab"));
  const activeField = PROMPT_TAB_CONFIGS.find((tab) => tab.kind === activeTab)!;

  const promptTabs = useMemo(
    () =>
      PROMPT_TAB_CONFIGS.map((tab) => ({
        ...tab,
        label: getPromptFieldLabel(t, tab.kind),
        editLabel: getPromptEditLabel(t, tab.kind),
        tabLabel: getPromptTabLabel(t, tab.kind),
        placeholder:
          tab.kind === "verdict"
            ? getVerdictPromptPlaceholder(t)
            : tab.kind === "generate"
              ? getGeneratePromptPlaceholder(t)
              : tab.kind === "evaluate"
                ? getEvaluatePromptPlaceholder(t)
                : tab.kind === "generalEvaluate"
                  ? getGeneralEvaluatePromptPlaceholder(t)
                  : getRefinePromptPlaceholder(t),
        resumeHint:
          tab.kind === "verdict"
            ? getVerdictPromptResumeHint(t)
            : tab.kind === "generate"
              ? getGeneratePromptJobContextHint(t)
              : tab.kind === "evaluate"
                ? getEvaluatePromptJobHint(t)
                : tab.kind === "generalEvaluate"
                  ? getGeneralEvaluatePromptResumeHint(t)
                  : getRefinePromptResumeHint(t),
      })),
    [t],
  );

  const activeTabConfig = promptTabs.find((tab) => tab.kind === activeTab)!;

  const [prompts, setPrompts] = useState<PromptValues>(EMPTY_PROMPTS);
  const [storedPrompts, setStoredPrompts] =
    useState<StoredPromptValues>(EMPTY_PROMPTS);
  const [loading, setLoading] = useState(true);
  const [savingKind, setSavingKind] = useState<PromptTab | null>(null);
  const [promptError, setPromptError] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);

  const promptKey = promptValueKey(activeTab);
  const extensionKey = extensionValueKey(activeTab);
  const activePrompt = prompts[promptKey];
  const activeExtension = prompts[extensionKey];
  const storedPrompt = storedPrompts[promptKey];

  useEffect(() => {
    let cancelled = false;
    loadPrompts().then((promptsRes) => {
      if (cancelled) return;
      if (promptsRes.error) {
        toast(promptsRes.error ?? t("toast.promptsLoadFailed"), "error");
      } else if (promptsRes.data) {
        setPrompts(promptsRes.data);
        setStoredPrompts(promptsRes.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; cached loader dedupes Strict Mode remounts
  }, []);

  useEffect(() => {
    setPromptError(undefined);
    setEditing(false);
  }, [activeTab]);

  function setActiveTab(tab: PromptTab) {
    router.replace(`/settings/prompts?tab=${tab}`, { scroll: false });
  }

  function setActivePrompt(nextValue: string) {
    setPrompts((current) => ({
      ...current,
      [promptKey]: nextValue,
    }));
  }

  function setActiveExtension(nextValue: string) {
    setPrompts((current) => ({
      ...current,
      [extensionKey]: nextValue,
    }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!activePrompt.trim()) {
      setPromptError(
        t("validation.promptRequired", { label: activeTabConfig.label }),
      );
      return;
    }
    setPromptError(undefined);

    setSavingKind(activeTab);
    const res = await savePromptTab(activeTab, {
      prompt: activePrompt.trim(),
      extension: activeExtension.trim(),
    });
    setSavingKind(null);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.promptSaveFailed"), "error");
      return;
    }
    setPromptsCache(res.data);
    setPrompts(res.data);
    setStoredPrompts(res.data);
    await refreshTokenUsed();
    toast(t("toast.promptSaved", { label: activeTabConfig.tabLabel }), "success");
  }

  const converting =
    savingKind === activeTab &&
    needsMarkdownFormatOnSave(activePrompt, storedPrompt);
  const saveBusy = savingKind === activeTab;

  return (
    <section className="w-full space-y-6">
      <p className="text-sm text-foreground">
        {getSystemPromptQualityNotice(t)}
      </p>

      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label={t("settings.prompts.tablistAria")}
      >
        {promptTabs.map((tab) => {
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
              {tab.tabLabel}
            </button>
          );
        })}
      </div>

      <form
        noValidate
        onSubmit={onSave}
        className="space-y-6 rounded-lg rounded-tl-none border border-border bg-surface p-4"
      >
        <div
          id={`prompts-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`prompts-tab-${activeTab}`}
          className="space-y-6"
        >
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>
                {activeTabConfig.label}
                <RequiredMark />
              </span>
              <EditButton
                label={activeTabConfig.editLabel}
                disabled={loading}
                onClick={() => setEditing(true)}
              />
            </div>
            {loading ? (
              <p className="text-muted">{t("settings.prompts.loading")}</p>
            ) : (
              <div
                className="min-h-16 rounded-md border border-border bg-background px-3 py-2"
                aria-invalid={Boolean(promptError)}
              >
                {activePrompt.trim() ? (
                  <AiVerdictMarkdown markdown={activePrompt} />
                ) : (
                  <p className="text-muted">{activeTabConfig.placeholder}</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted">{getAutoMarkdownFormatHint(t)}</p>
            {activeTabConfig.resumeHint ? (
              <p className="text-xs text-muted">{activeTabConfig.resumeHint}</p>
            ) : null}
            <FieldError message={promptError} />
          </div>

          <div className="space-y-1 text-sm">
            <span>{t(`settings.prompts.fields.${activeTab}Extension`)}</span>
            {loading ? (
              <p className="text-muted">{t("settings.prompts.loading")}</p>
            ) : (
              <textarea
                value={activeExtension}
                onChange={(e) => setActiveExtension(e.target.value)}
                rows={activeField.rows}
                placeholder={t("settings.prompts.extensions.placeholder")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
              />
            )}
            <p className="text-xs text-muted">
              {t("settings.prompts.extensions.description")}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveBusy}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {saveBusy
              ? t("settings.prompts.saving")
              : t("settings.prompts.save")}
          </button>
        </div>
      </form>

      {editing ? (
        <PromptEditDialog
          title={t("settings.prompts.edit.dialogTitle", {
            label: activeTabConfig.label,
          })}
          value={activePrompt}
          defaultValue={DEFAULT_PROMPT_BY_KIND[activeTab]}
          rows={activeField.rows}
          placeholder={activeTabConfig.placeholder}
          impactNotice={t("settings.prompts.edit.systemImpactNotice")}
          resetLabel={t("settings.prompts.edit.reset")}
          applyLabel={t("crud.common.apply")}
          onClose={() => setEditing(false)}
          onApply={(nextValue) => {
            setActivePrompt(nextValue);
            setPromptError(undefined);
          }}
        />
      ) : null}

      {converting ? (
        <BusyOverlay
          title={t("settings.prompts.busy.convertingTitle")}
          description={t("settings.prompts.busy.convertingDescription")}
        />
      ) : null}
    </section>
  );
}
