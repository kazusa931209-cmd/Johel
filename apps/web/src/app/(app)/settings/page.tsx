"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTheme } from "@/components/app/ThemeProvider";
import { useToast } from "@/components/app/ToastProvider";
import { getSettings, getGenerationProcess, getMe, saveGenerationProcess, saveSettings } from "@/lib/api";
import { clearGenerateSession } from "@/lib/generate-session";
import type { AiProviderId } from "@/lib/api";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const PROVIDER_OPTIONS: { value: AiProviderId; label: string }[] = [
  { value: "cursor", label: "Cursor AI Agent" },
  { value: "openai", label: "OpenAI" },
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
  workflowRecommendationThreshold?: string;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
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
  const [doWorkflowRecommendation, setDoWorkflowRecommendation] = useState(false);
  const [workflowRecommendationThreshold, setWorkflowRecommendationThreshold] =
    useState("70");
  const [savedDoVerdict, setSavedDoVerdict] = useState(true);
  const [savedDoEvaluate, setSavedDoEvaluate] = useState(true);
  const [savedDoWorkflowRecommendation, setSavedDoWorkflowRecommendation] =
    useState(false);
  const [savedWorkflowRecommendationThreshold, setSavedWorkflowRecommendationThreshold] =
    useState("70");
  const [userId, setUserId] = useState<string | null>(null);
  const [processLoading, setProcessLoading] = useState(true);
  const [processSaving, setProcessSaving] = useState(false);
  const [processErrors, setProcessErrors] = useState<FormErrors>({});

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
        setDoWorkflowRecommendation(res.data.doWorkflowRecommendation);
        setWorkflowRecommendationThreshold(
          String(res.data.workflowRecommendationThreshold),
        );
        setSavedDoVerdict(res.data.doVerdict);
        setSavedDoEvaluate(res.data.doEvaluate);
        setSavedDoWorkflowRecommendation(res.data.doWorkflowRecommendation);
        setSavedWorkflowRecommendationThreshold(
          String(res.data.workflowRecommendationThreshold),
        );
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
      nextErrors.provider = "Provider is required.";
    }
    if (apiKey.trim().length < 8) {
      nextErrors.apiKey = "API key must be at least 8 characters.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    const res = await saveSettings(provider, apiKey);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed", "error");
      return;
    }
    setSavedProvider(res.data.provider);
    setProvider(res.data.provider ?? provider);
    setMasked(res.data.apiKeyMasked);
    setApiKey("");
    setShowApiKey(false);
    setErrors({});
    toast("AI Agent settings saved.", "success");
  }

  async function onSaveProcess(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    const threshold = Number.parseInt(workflowRecommendationThreshold, 10);
    if (
      Number.isNaN(threshold) ||
      threshold < 0 ||
      threshold > 100 ||
      !Number.isInteger(threshold)
    ) {
      nextErrors.workflowRecommendationThreshold =
        "Recommendation threshold must be an integer from 0 to 100.";
    }
    setProcessErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setProcessSaving(true);
    const res = await saveGenerationProcess({
      doVerdict,
      doEvaluate,
      doWorkflowRecommendation,
      workflowRecommendationThreshold: threshold,
    });
    setProcessSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed.", "error");
      return;
    }
    setDoVerdict(res.data.doVerdict);
    setDoEvaluate(res.data.doEvaluate);
    setDoWorkflowRecommendation(res.data.doWorkflowRecommendation);
    setWorkflowRecommendationThreshold(
      String(res.data.workflowRecommendationThreshold),
    );
    const processChanged =
      res.data.doVerdict !== savedDoVerdict ||
      res.data.doEvaluate !== savedDoEvaluate ||
      res.data.doWorkflowRecommendation !== savedDoWorkflowRecommendation ||
      res.data.workflowRecommendationThreshold !==
        Number.parseInt(savedWorkflowRecommendationThreshold, 10);
    if (processChanged && userId) {
      clearGenerateSession(userId);
    }
    setSavedDoVerdict(res.data.doVerdict);
    setSavedDoEvaluate(res.data.doEvaluate);
    setSavedDoWorkflowRecommendation(res.data.doWorkflowRecommendation);
    setSavedWorkflowRecommendationThreshold(
      String(res.data.workflowRecommendationThreshold),
    );
    toast("Process settings saved.", "success");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted">Appearance and account preferences.</p>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Theme</h2>
        <div className="flex gap-2">
          {OPTIONS.map((option) => {
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
      <form
        onSubmit={onSave}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-medium">AI Agent</h2>
        <label className="block space-y-1 text-sm">
          <span>
            Provider
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
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
              {PROVIDER_OPTIONS.map((option) => (
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
            API Key
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : showMaskedKey ? (
            <p className="font-mono text-sm text-muted">{masked}</p>
          ) : (
            <p className="text-sm text-muted">No key saved yet for this provider.</p>
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
                showMaskedKey ? "Enter a new key to replace" : "Enter API key"
              }
              aria-invalid={Boolean(errors.apiKey)}
              className="w-full rounded-md border border-border bg-background py-2 pr-10 pl-3 outline-none focus:border-muted"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((value) => !value)}
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
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
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      <form
        onSubmit={onSaveProcess}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-medium">Process</h2>
        <p className="text-sm text-muted">
          Choose which AI steps run during Generate.
        </p>
        {processLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doVerdict}
                onChange={(e) => setDoVerdict(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>Do Verdict</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doWorkflowRecommendation}
                onChange={(e) => setDoWorkflowRecommendation(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>Do Workflow Recommendation</span>
            </label>
            {doWorkflowRecommendation ? (
              <label className="block space-y-1 space-x-2 text-sm">
                <span>
                  Recommendation threshold
                  <span className="ml-0.5 text-danger" aria-hidden>
                    *
                  </span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={workflowRecommendationThreshold}
                  onChange={(e) => {
                    setWorkflowRecommendationThreshold(e.target.value);
                    if (processErrors.workflowRecommendationThreshold) {
                      setProcessErrors((prev) => ({
                        ...prev,
                        workflowRecommendationThreshold: undefined,
                      }));
                    }
                  }}
                  aria-invalid={Boolean(
                    processErrors.workflowRecommendationThreshold,
                  )}
                  className="w-full max-w-32 rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
                />
                <p className="text-xs text-muted">
                  Integer from 0 to 100. The best-matching workflow is selected
                  only when its score meets or exceeds this value.
                </p>
                {processErrors.workflowRecommendationThreshold ? (
                  <p className="text-sm text-danger">
                    {processErrors.workflowRecommendationThreshold}
                  </p>
                ) : null}
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doEvaluate}
                onChange={(e) => setDoEvaluate(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>Do Evaluate</span>
            </label>
          </div>
        )}
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          {processSaving ? "Saving…" : "Save"}
        </button>
      </form>
      
    </section>
  );
}
