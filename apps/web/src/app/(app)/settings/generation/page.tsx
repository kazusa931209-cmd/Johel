"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  RUN_LANGUAGES,
  type RunLanguage,
} from "@/components/generate/combine-types";
import { getGenerationProcess, getMe, saveGenerationProcess } from "@/lib/api";
import type { ResumeLanguage } from "@/lib/api";
import { clearGenerateSession } from "@/lib/generate-session";

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

const DEFAULT_SETTINGS = {
  doVerdict: true,
  doEvaluate: true,
  resumeLanguage: "en" as ResumeLanguage,
};

export default function GenerationSettingsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doVerdict, setDoVerdict] = useState(DEFAULT_SETTINGS.doVerdict);
  const [doEvaluate, setDoEvaluate] = useState(DEFAULT_SETTINGS.doEvaluate);
  const [resumeLanguage, setResumeLanguage] = useState<ResumeLanguage>(
    DEFAULT_SETTINGS.resumeLanguage,
  );
  const [savedDoVerdict, setSavedDoVerdict] = useState(DEFAULT_SETTINGS.doVerdict);
  const [savedDoEvaluate, setSavedDoEvaluate] = useState(DEFAULT_SETTINGS.doEvaluate);
  const [savedResumeLanguage, setSavedResumeLanguage] = useState<ResumeLanguage>(
    DEFAULT_SETTINGS.resumeLanguage,
  );
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGenerationProcess().then((res) => {
      if (cancelled) return;
      if (res.data) {
        setDoVerdict(res.data.doVerdict);
        setDoEvaluate(res.data.doEvaluate);
        setResumeLanguage(res.data.resumeLanguage);
        setSavedDoVerdict(res.data.doVerdict);
        setSavedDoEvaluate(res.data.doEvaluate);
        setSavedResumeLanguage(res.data.resumeLanguage);
      }
      setLoading(false);
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

    setSaving(true);
    const res = await saveGenerationProcess({
      doVerdict,
      doEvaluate,
      resumeLanguage,
    });
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.generationSaveFailed"), "error");
      return;
    }
    setDoVerdict(res.data.doVerdict);
    setDoEvaluate(res.data.doEvaluate);
    setResumeLanguage(res.data.resumeLanguage);
    const settingsChanged =
      res.data.doVerdict !== savedDoVerdict ||
      res.data.doEvaluate !== savedDoEvaluate ||
      res.data.resumeLanguage !== savedResumeLanguage;
    if (settingsChanged && userId) {
      clearGenerateSession(userId);
    }
    setSavedDoVerdict(res.data.doVerdict);
    setSavedDoEvaluate(res.data.doEvaluate);
    setSavedResumeLanguage(res.data.resumeLanguage);
    toast(t("toast.generationSaved"), "success");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.generation.title")}
        </h1>
        <p className="text-muted">{t("settings.generation.description")}</p>
      </div>
      <form
        onSubmit={onSave}
        className="space-y-6 rounded-lg border border-border bg-surface p-4"
      >
        <div className="space-y-3">
          <h2 className="text-sm font-medium">
            {t("settings.generation.process.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("settings.generation.process.description")}
          </p>
          {loading ? (
            <p className="text-sm text-muted">
              {t("settings.generation.process.loading")}
            </p>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={doVerdict}
                  onChange={(e) => setDoVerdict(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span>{t("settings.generation.process.doVerdict")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={doEvaluate}
                  onChange={(e) => setDoEvaluate(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span>{t("settings.generation.process.doEvaluate")}</span>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <h2 className="text-sm font-medium">
            {t("settings.generation.resumeLanguage.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("settings.generation.resumeLanguage.description")}
          </p>
          {loading ? (
            <p className="text-sm text-muted">
              {t("settings.generation.process.loading")}
            </p>
          ) : (
            <label className="block max-w-xs space-y-1 text-sm">
              <span>{t("settings.generation.resumeLanguage.label")}</span>
              <div className="relative">
                <select
                  value={resumeLanguage}
                  onChange={(e) =>
                    setResumeLanguage(e.target.value as RunLanguage)
                  }
                  className="w-full appearance-none rounded-md border border-border bg-background py-2 pr-9 pl-3 outline-none focus:border-muted"
                >
                  {RUN_LANGUAGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </label>
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {saving
              ? t("settings.generation.saving")
              : t("settings.generation.save")}
          </button>
        </div>
      </form>
    </section>
  );
}
