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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { savePrompt, savePromptExtension, type PromptKind } from "@/lib/api";
import { loadMe, loadPrompts, setPromptsCache } from "@/lib/cached-settings";
import { needsMarkdownFormatOnSave } from "@/lib/markdown-format";
import {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_VERDICT_PROMPT,
  getAutoMarkdownFormatHint,
  getEvaluatePromptJobHint,
  getEvaluatePromptPlaceholder,
  getGeneratePromptJobContextHint,
  getGeneratePromptPlaceholder,
  getPromptEditLabel,
  getPromptFieldLabel,
  getPromptTabLabel,
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
];

const PROMPT_TAB_IDS = new Set(PROMPT_TAB_CONFIGS.map((tab) => tab.kind));

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

function extensionValueKey(kind: PromptTab): keyof PromptValues {
  return `${kind}Extension`;
}

type PromptValues = {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  verdictExtension: string;
  generateExtension: string;
  evaluateExtension: string;
};

type StoredPromptValues = PromptValues;

const EMPTY_PROMPTS: PromptValues = {
  verdictPrompt: "",
  generatePrompt: "",
  evaluatePrompt: "",
  verdictExtension: "",
  generateExtension: "",
  evaluateExtension: "",
};

function PromptsPageFallback() {
  const t = useT();

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.prompts.title")}
        </h1>
        <p className="text-muted">{t("settings.prompts.loading")}</p>
      </div>
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
              : getEvaluatePromptPlaceholder(t),
        resumeHint:
          tab.kind === "verdict"
            ? getVerdictPromptResumeHint(t)
            : tab.kind === "generate"
              ? getGeneratePromptJobContextHint(t)
              : getEvaluatePromptJobHint(t),
      })),
    [t],
  );

  const activeTabConfig = promptTabs.find((tab) => tab.kind === activeTab)!;

  const [prompts, setPrompts] = useState<PromptValues>(EMPTY_PROMPTS);
  const [storedPrompts, setStoredPrompts] =
    useState<StoredPromptValues>(EMPTY_PROMPTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKind, setSavingKind] = useState<PromptTab | null>(null);
  const [resettingKind, setResettingKind] = useState<PromptTab | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);

  const valueKey = isAdmin ? promptValueKey(activeTab) : extensionValueKey(activeTab);
  const storedKey = valueKey;
  const activeValue = prompts[valueKey];
  const activeStored = storedPrompts[storedKey];

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPrompts(), loadMe()]).then(([promptsRes, meRes]) => {
      if (cancelled) return;
      if (promptsRes.error) {
        toast(promptsRes.error ?? t("toast.promptsLoadFailed"), "error");
      } else if (promptsRes.data) {
        setPrompts(promptsRes.data);
        setStoredPrompts(promptsRes.data);
      }
      setIsAdmin(meRes.data?.role === "admin");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; cached loader dedupes Strict Mode remounts
  }, []);

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
    if (isAdmin) {
      if (!activeValue.trim()) {
        setFieldError(
          t("validation.promptRequired", { label: activeTabConfig.label }),
        );
        return;
      }
      setFieldError(undefined);

      setSavingKind(activeTab);
      const res = await savePrompt(activeTab, activeValue.trim());
      setSavingKind(null);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.promptSaveFailed"), "error");
        return;
      }
      setPromptsCache(res.data);
      setPrompts(res.data);
      setStoredPrompts(res.data);
      await refreshTokenUsed();
      toast(t("toast.promptSaved", { label: activeTabConfig.label }), "success");
      return;
    }

    setFieldError(undefined);
    setSavingKind(activeTab);
    const extensionLabel = t(`settings.prompts.fields.${activeTab}Extension`);
    const res = await savePromptExtension(activeTab, activeValue.trim());
    setSavingKind(null);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.promptSaveFailed"), "error");
      return;
    }
    setPromptsCache(res.data);
    setPrompts(res.data);
    setStoredPrompts(res.data);
    toast(t("toast.promptSaved", { label: extensionLabel }), "success");
  }

  async function onConfirmReset() {
    setResettingKind(activeTab);
    const res = await savePrompt(activeTab, DEFAULT_PROMPT_BY_KIND[activeTab]);
    setResettingKind(null);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.promptResetFailed"), "error");
      return;
    }
    setPromptsCache(res.data);
    setPrompts(res.data);
    setStoredPrompts(res.data);
    setConfirmReset(false);
    await refreshTokenUsed();
    toast(
      t("toast.promptResetSuccess", { label: activeTabConfig.label }),
      "success",
    );
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.prompts.title")}
        </h1>
        <p className="text-muted">{t("settings.prompts.description")}</p>
        {isAdmin ? (
          <p className="text-sm text-foreground">
            {getSystemPromptQualityNotice(t)}
          </p>
        ) : (
          <p className="text-sm text-foreground">
            {t("settings.prompts.extensions.description")}
          </p>
        )}
      </div>

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
              {isAdmin
                ? activeTabConfig.label
                : t(`settings.prompts.fields.${activeTab}Extension`)}
              {isAdmin ? <RequiredMark /> : null}
            </span>
            {isAdmin ? (
              <EditButton
                label={activeTabConfig.editLabel}
                disabled={loading}
                onClick={() => setEditing(true)}
              />
            ) : null}
          </div>
          {loading ? (
            <p className="text-muted">{t("settings.prompts.loading")}</p>
          ) : isAdmin ? (
            <div
              className="min-h-16 rounded-md border border-border bg-background px-3 py-2"
              aria-invalid={Boolean(fieldError)}
            >
              {activeValue.trim() ? (
                <AiVerdictMarkdown markdown={activeValue} />
              ) : (
                <p className="text-muted">{activeTabConfig.placeholder}</p>
              )}
            </div>
          ) : (
            <textarea
              value={activeValue}
              onChange={(e) => {
                setActivePrompt(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              rows={activeField.rows}
              placeholder={t("settings.prompts.extensions.placeholder")}
              aria-invalid={Boolean(fieldError)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
          )}
          {isAdmin ? (
            <>
              <p className="text-xs text-muted">{getAutoMarkdownFormatHint(t)}</p>
              {activeTabConfig.resumeHint ? (
                <p className="text-xs text-muted">{activeTabConfig.resumeHint}</p>
              ) : null}
            </>
          ) : null}
          <FieldError message={fieldError} />
        </div>

        <div className="flex justify-end gap-2">
          {isAdmin ? (
            <button
              type="button"
              disabled={loading || actionBusy}
              onClick={() => setConfirmReset(true)}
              className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground hover:opacity-90 disabled:opacity-60"
            >
              {t("settings.prompts.resetToDefault")}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={actionBusy}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {saveBusy
              ? t("settings.prompts.saving")
              : t("settings.prompts.save")}
          </button>
        </div>
      </form>

      {isAdmin && confirmReset ? (
        <ConfirmDialog
          title={t("settings.prompts.resetDialog.title")}
          closeDisabled={resetBusy}
          confirmDisabled={resetBusy}
          onClose={() => setConfirmReset(false)}
          onConfirm={() => void onConfirmReset()}
          confirmLabel={
            resetBusy
              ? t("settings.prompts.resetting")
              : t("settings.prompts.resetToDefault")
          }
        >
          <p className="text-muted">
            {t("settings.prompts.resetDialog.body", {
              label: activeTabConfig.label,
            })}
          </p>
        </ConfirmDialog>
      ) : null}

      {isAdmin && editing ? (
        <PromptEditDialog
          title={t("settings.prompts.edit.dialogTitle", {
            label: activeTabConfig.label,
          })}
          value={activeValue}
          rows={activeField.rows}
          placeholder={activeTabConfig.placeholder}
          onClose={() => setEditing(false)}
          onApply={(nextValue) => {
            setActivePrompt(nextValue);
            setFieldError(undefined);
          }}
        />
      ) : null}

      {isAdmin && converting ? (
        <BusyOverlay
          title={
            resetBusy
              ? t("settings.prompts.busy.resettingTitle")
              : t("settings.prompts.busy.convertingTitle")
          }
          description={
            resetBusy
              ? t("settings.prompts.busy.resettingDescription")
              : t("settings.prompts.busy.convertingDescription")
          }
        />
      ) : null}
    </section>
  );
}
