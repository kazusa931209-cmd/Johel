"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import type { GeneralEvaluationHistoryEntry } from "@/lib/general-evaluation-history";
import type { ResumeDownloadLabel, ResumeLanguage } from "@/lib/api";

type GeneralResumeEvaluateStepProps = {
  resume: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  resumeLanguage: ResumeLanguage;
  history: GeneralEvaluationHistoryEntry[];
  evaluating: boolean;
  draftUserPrompt: string;
  userPromptError?: string | null;
  onDraftUserPromptChange: (value: string) => void;
  onEvaluate: () => void | Promise<void>;
  onFooterChange?: (node: ReactNode | null) => void;
  onDownloaded?: () => void | Promise<void>;
};

function formatEvaluationTimestamp(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function GeneralResumeEvaluateStep({
  resume,
  downloadLabel,
  resumeLanguage,
  history,
  evaluating,
  draftUserPrompt,
  userPromptError,
  onDraftUserPromptChange,
  onEvaluate,
  onFooterChange,
  onDownloaded,
}: GeneralResumeEvaluateStepProps) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language) {
      setLocale(navigator.language);
    }
  }, []);

  const { downloadAs, downloadAsZip, downloading, pdfDisabled } =
    useResumeDownload(resume, downloadLabel, {
      resumeLanguage,
      onDownloaded,
    });

  useRegisterGenerateStepNav({
    downloadMenu: resume
      ? {
          onDownloadDocx: () => void downloadAs("docx"),
          onDownloadPdf: () => void downloadAs("pdf"),
          onDownloadZip: () => void downloadAsZip(),
          pdfDisabled,
        }
      : undefined,
    downloadBusy: downloading,
  });

  const footerNode = useMemo(
    () => (
      <button
        type="button"
        onClick={() => void onEvaluate()}
        disabled={evaluating || !resume}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
      >
        {evaluating
          ? t("resumeBuilder.evaluateStep.evaluatingButton")
          : t("resumeBuilder.evaluateStep.evaluateButton")}
      </button>
    ),
    [evaluating, onEvaluate, resume, t],
  );

  const onFooterChangeRef = useRef(onFooterChange);
  onFooterChangeRef.current = onFooterChange;

  useEffect(() => {
    onFooterChangeRef.current?.(footerNode);
  }, [footerNode]);

  useEffect(() => {
    return () => {
      onFooterChangeRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length, evaluating]);

  if (!resume) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        {t("generate.evaluateStep.noEvaluation")}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
      >
        {history.length === 0 && !evaluating ? (
          <p className="text-sm text-muted">
            {t("resumeBuilder.evaluateStep.emptyHintNoHistory")}
          </p>
        ) : null}

        {history.map((entry) => (
          <div key={entry.id} className="space-y-2">
            {entry.userPrompt.trim() ? (
              <div className="flex justify-end">
                <div
                  className="max-w-[92%] rounded-2xl rounded-br-md border border-border bg-accent/15 px-4 py-3 text-sm"
                >
                  <AiVerdictMarkdown markdown={entry.userPrompt} />
                </div>
              </div>
            ) : null}
            <div className="flex justify-start">
              <div className="max-w-[92%] space-y-2 rounded-2xl rounded-bl-md border border-border bg-surface-muted px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <time
                    className="text-xs text-muted"
                    dateTime={entry.createdAt}
                  >
                    {formatEvaluationTimestamp(entry.createdAt, locale)}
                  </time>
                  <CopyButton
                    label={t("resumeBuilder.evaluateStep.copyResult")}
                    onClick={() => void navigator.clipboard.writeText(entry.markdown)}
                  />
                </div>
                <AiVerdictMarkdown markdown={entry.markdown} />
              </div>
            </div>
          </div>
        ))}

        {evaluating ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
              {t("generate.evaluateStep.pending")}
            </div>
          </div>
        ) : null}
      </div>

      <label className="block shrink-0 space-y-1 text-sm">
        <span>
          {t("resumeBuilder.evaluateStep.userPromptLabel")}
          <span className="ml-0.5 text-danger" aria-hidden>*</span>
        </span>
        <textarea
          value={draftUserPrompt}
          onChange={(e) => onDraftUserPromptChange(e.target.value)}
          rows={4}
          placeholder={t("resumeBuilder.evaluateStep.userPromptPlaceholder")}
          aria-invalid={Boolean(userPromptError)}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
        {userPromptError ? (
          <p className="text-sm text-danger">{userPromptError}</p>
        ) : null}
      </label>

      {evaluating ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.evaluateStep.evaluating.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.evaluateStep.evaluating.description")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
