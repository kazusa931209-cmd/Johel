"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "@/components/app/LocaleProvider";
import { useTheme } from "@/components/app/ThemeProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  getGenerationProcess,
  getMe,
  getSettings,
  saveGenerationProcess,
  saveSettings,
} from "@/lib/api";
import { clearGenerateSession } from "@/lib/generate-session";
import type { AiProviderId } from "@/lib/api";
import type { Locale } from "@/lib/locale";
import type { Theme } from "@/lib/theme";

const LANGUAGE_OPTIONS: { value: Locale; labelKey: string }[] = [
  { value: "en", labelKey: "settings.environment.language.english" },
  { value: "ko", labelKey: "settings.environment.language.korean" },
];

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.7 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.1" />
      <path d="M6.6 6.6C4 8.4 2.5 11 2.5 12S6 19 12 19a10.5 10.5 0 0 0 5.4-1.5" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

type FormErrors = {
  provider?: string;
  apiKey?: string;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { toast } = useToast();
  const [savedProvider, setSavedProvider] = useState<AiProviderId | null>(null);
  const [provider, setProvider] = useState<AiProviderId>("cursor");
  const [masked, setMasked] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [doVerdict, setDoVerdict] = useState(true);
  const [doEvaluate, setDoEvaluate] = useState(true);
  const [savedDoVerdict, setSavedDoVerdict] = useState(true);
  const [savedDoEvaluate, setSavedDoEvaluate] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [processLoading, setProcessLoading] = useState(true);
  const [processSaving, setProcessSaving] = useState(false);

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "dark", label: t("settings.environment.theme.dark") },
    { value: "light", label: t("settings.environment.theme.light") },
  ];

  const providerOptions: { value: AiProviderId; label: string }[] = [
    { value: "cursor", label: t("settings.environment.aiAgent.providerCursor") },
    { value: "openai", label: t("settings.environment.aiAgent.providerOpenai") },
  ];

  const providerMatchesSaved = savedProvider === provider;
  const showMaskedKey = providerMatchesSaved && masked;

  useEffect(() => {
    let cancelled = false;
    getSettings().then((res) => {
      if (cancelled) return;
      if (res.data) {
        if (res.data.provider) {
          setSavedProvider(res.data.provider);
          setProvider(res.data.provider);
        }
        setMasked(res.data.apiKeyMasked);
      }
      setLoading(false);
    });
    getGenerationProcess().then((res) => {
      if (cancelled) return;
      if (res.data) {
        setDoVerdict(res.data.doVerdict);
        setDoEvaluate(res.data.doEvaluate);
        setSavedDoVerdict(res.data.doVerdict);
        setSavedDoEvaluate(res.data.doEvaluate);
      }
      setProcessLoading(false);
    });
    getMe().then((res) => {
      if (cancelled) return;
      setUserId(res.data?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!provider) {
      nextErrors.provider = t("validation.providerRequired");
    }
    if (apiKey.trim().length < 8) {
      nextErrors.apiKey = t("validation.apiKeyMinLength");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    const res = await saveSettings(provider, apiKey);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.aiAgentSaveFailed"), "error");
      return;
    }
    setSavedProvider(res.data.provider);
    setProvider(res.data.provider ?? provider);
    setMasked(res.data.apiKeyMasked);
    setApiKey("");
    setShowApiKey(false);
    setErrors({});
    toast(t("toast.aiAgentSaved"), "success");
  }

  async function onSaveProcess(e: FormEvent) {
    e.preventDefault();

    setProcessSaving(true);
    const res = await saveGenerationProcess({
      doVerdict,
      doEvaluate,
    });
    setProcessSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.processSaveFailed"), "error");
      return;
    }
    setDoVerdict(res.data.doVerdict);
    setDoEvaluate(res.data.doEvaluate);
    const processChanged =
      res.data.doVerdict !== savedDoVerdict ||
      res.data.doEvaluate !== savedDoEvaluate;
    if (processChanged && userId) {
      clearGenerateSession(userId);
    }
    setSavedDoVerdict(res.data.doVerdict);
    setSavedDoEvaluate(res.data.doEvaluate);
    toast(t("toast.processSaved"), "success");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.environment.title")}
        </h1>
        <p className="text-muted">{t("settings.environment.description")}</p>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">{t("settings.environment.theme.title")}</h2>
        <div className="flex gap-2">
          {themeOptions.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "border border-border bg-surface-muted text-foreground hover:opacity-90"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">
          {t("settings.environment.language.title")}
        </h2>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map((option) => {
            const active = locale === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setLocale(option.value)}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "border border-border bg-surface-muted text-foreground hover:opacity-90"
                }`}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <form
        onSubmit={onSave}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-medium">{t("settings.environment.aiAgent.title")}</h2>
        <label className="block space-y-1 text-sm">
          <span>
            {t("settings.environment.aiAgent.provider")}
            <span className="ml-0.5 text-danger" aria-hidden>*</span>
          </span>
          <div className="relative">
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as AiProviderId);
                setErrors((prev) => ({ ...prev, provider: undefined }));
              }}
              aria-invalid={Boolean(errors.provider)}
              className="w-full appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-10 outline-none"
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
          {errors.provider ? (
            <p className="text-sm text-danger">{errors.provider}</p>
          ) : null}
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("settings.environment.aiAgent.apiKey")}
            <span className="ml-0.5 text-danger" aria-hidden>*</span>
          </span>
          {loading ? (
            <p className="text-muted">{t("settings.environment.aiAgent.loading")}</p>
          ) : showMaskedKey ? (
            <p className="font-mono text-sm text-muted">{masked}</p>
          ) : (
            <p className="text-sm text-muted">
              {t("settings.environment.aiAgent.noKeySaved")}
            </p>
          )}
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setErrors((prev) => ({ ...prev, apiKey: undefined }));
              }}
              placeholder={
                showMaskedKey
                  ? t("settings.environment.aiAgent.placeholderNewKey")
                  : t("settings.environment.aiAgent.placeholderEnterKey")
              }
              aria-invalid={Boolean(errors.apiKey)}
              className="w-full rounded-md border border-border bg-background py-2 pr-10 pl-3 outline-none focus:border-muted"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((value) => !value)}
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label={
                showApiKey
                  ? t("settings.environment.aiAgent.hideApiKey")
                  : t("settings.environment.aiAgent.showApiKey")
              }
            >
              {showApiKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.apiKey ? (
            <p className="text-sm text-danger">{errors.apiKey}</p>
          ) : null}
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? t("settings.environment.aiAgent.saving")
              : t("settings.environment.aiAgent.save")}
          </button>
        </div>
      </form>
      <form
        onSubmit={onSaveProcess}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-medium">{t("settings.environment.process.title")}</h2>
        <p className="text-sm text-muted">
          {t("settings.environment.process.description")}
        </p>
        {processLoading ? (
          <p className="text-sm text-muted">{t("settings.environment.process.loading")}</p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doVerdict}
                onChange={(e) => setDoVerdict(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>{t("settings.environment.process.doVerdict")}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doEvaluate}
                onChange={(e) => setDoEvaluate(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>{t("settings.environment.process.doEvaluate")}</span>
            </label>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {processSaving
              ? t("settings.environment.process.saving")
              : t("settings.environment.process.save")}
          </button>
        </div>
      </form>
    </section>
  );
}
