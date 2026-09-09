"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { parseGeneratedResume } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { GenerateHistoryStepView } from "@/components/generate/GenerateHistoryStepView";
import { GeneratePanelCopyActions } from "@/components/generate/GeneratePanelCopyActions";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import {
  GenerateTimeline,
  type GenerateStep,
} from "@/components/generate/GenerateTimeline";
import { useResumeDocxDownload } from "@/components/generate/useResumeDocxDownload";
import { BackButton } from "@/components/shared/back-button";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { getGeneration, type GenerationDetail } from "@/lib/api";
import type { GenerateJobState } from "@/lib/generate-session";
import {
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "@/lib/generate-steps";
import { formatThousandsSeparated } from "@/lib/helper";
import { noiseFilter } from "@/lib/jobNoiseFilter";

function parseResume(value: unknown): GeneratedResume | null {
  if (!value || typeof value !== "object") return null;
  const parsed = parseGeneratedResume(value);
  return parsed.success ? parsed.data : null;
}

function parseJob(value: unknown): GenerateJobState {
  if (!value || typeof value !== "object") {
    return { method: "manual", jobText: "", acceptedMarkdown: null };
  }
  const raw = value as Record<string, unknown>;
  const method =
    raw.method === "url" || raw.method === "file" || raw.method === "manual"
      ? raw.method
      : "manual";
  return {
    method,
    jobText: typeof raw.jobText === "string" ? raw.jobText : "",
    acceptedMarkdown:
      typeof raw.acceptedMarkdown === "string" ? raw.acceptedMarkdown : null,
  };
}

function parseCombine(value: unknown): CombineSnapshot {
  if (!value || typeof value !== "object") {
    return { profileId: "", language: "en", emphasis: "", companies: [] };
  }
  const raw = value as Record<string, unknown>;
  const companies = Array.isArray(raw.companies)
    ? raw.companies
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          if (typeof row.companyId !== "string") return null;
          return {
            companyId: row.companyId,
            startDate: typeof row.startDate === "string" ? row.startDate : "",
            endDate: typeof row.endDate === "string" ? row.endDate : "",
            roleContext:
              typeof row.roleContext === "string" ? row.roleContext : "",
            keywordContext:
              typeof row.keywordContext === "string" ? row.keywordContext : "",
            experienceIds: Array.isArray(row.experienceIds)
              ? row.experienceIds.filter(
                  (id): id is string => typeof id === "string",
                )
              : [],
          };
        })
        .filter((entry): entry is CombineSnapshot["companies"][number] =>
          Boolean(entry),
        )
    : [];

  return {
    profileId: typeof raw.profileId === "string" ? raw.profileId : "",
    language: typeof raw.language === "string" ? raw.language : "en",
    emphasis: typeof raw.emphasis === "string" ? raw.emphasis : "",
    companies,
  };
}

export default function HistoryDetailPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const t = useT();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GenerationDetail | null>(null);
  const [activeStep, setActiveStep] = useState<GenerateStep>("Job");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGeneration(publicId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyDetailLoadFailed"), "error");
        return;
      }
      setDetail(res.data);
      const step = res.data.activeStep as GenerateStep;
      setActiveStep(
        normalizeGenerateActiveStep(
          step,
          res.data.doEvaluate,
          res.data.doVerdict,
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [publicId, t, toast]);

  const job = useMemo(
    () => (detail ? parseJob(detail.job) : parseJob(null)),
    [detail],
  );
  const combine = useMemo(
    () => (detail ? parseCombine(detail.combine) : parseCombine(null)),
    [detail],
  );
  const resume = useMemo(
    () => (detail ? parseResume(detail.resume) : null),
    [detail],
  );

  const visibleSteps = useMemo(
    () =>
      detail
        ? getGenerateSteps(detail.doEvaluate, detail.doVerdict)
        : (["Job"] as GenerateStep[]),
    [detail],
  );

  const normalizedActiveStep = useMemo(
    () =>
      detail
        ? normalizeGenerateActiveStep(
            activeStep,
            detail.doEvaluate,
            detail.doVerdict,
          )
        : activeStep,
    [activeStep, detail],
  );

  const runLabel = combine.emphasis.trim() || combine.language;
  const { onDownload, downloading } = useResumeDocxDownload(resume, runLabel);
  const showDownload =
    detail?.status === "completed" && resume != null;

  const rawJobText = job.jobText.trim();
  const filteredJobText = useMemo(
    () => noiseFilter(rawJobText).text,
    [rawJobText],
  );
  const filteredCharCount = formatThousandsSeparated(filteredJobText.length);
  const isJobStep = normalizedActiveStep === "Job";

  const { previousTitle, previousContent, previousHeaderRight, previousMatchCurrent } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps,
      job,
      combine,
      resume,
    });

  if (loading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("crud.common.loading")}
      </main>
    );
  }

  if (!detail) {
    return (
      <section className="space-y-4">
        <BackButton href="/history" aria-label={t("history.detail.back")} />
        <p className="text-sm text-muted">{t("history.detail.notFound")}</p>
      </section>
    );
  }

  return (
    <section className="-m-6 flex h-[calc(100dvh-3.5rem)] w-auto flex-col overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-3">
              <BackButton
                href="/history"
                aria-label={t("history.detail.back")}
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("history.detail.title")}
              </h1>
            </div>
            <p className="pl-12 text-sm text-muted">{detail.publicId}</p>
          </div>
          <div className="min-w-0 flex-1">
            <GenerateTimeline
              active={normalizedActiveStep}
              steps={visibleSteps}
              onStepSelect={setActiveStep}
            />
          </div>
          {showDownload ? (
            <button
              type="button"
              disabled={downloading}
              onClick={() => void onDownload()}
              className="shrink-0 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {downloading
                ? t("generate.download.downloading")
                : t("generate.nav.download")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 pt-6 pb-6">
        <GenerateStepLayout
          previousTitle={previousTitle}
          previous={previousContent}
          previousHeaderRight={
            isJobStep ? (
              <GeneratePanelCopyActions
                text={filteredJobText}
                trailing={
                  <span
                    aria-label={t("generate.job.filteredCharCountAria", {
                      count: filteredCharCount,
                    })}
                  >
                    {filteredCharCount}
                  </span>
                }
              />
            ) : (
              previousHeaderRight
            )
          }
          currentTitle={isJobStep ? t("generate.steps.job") : undefined}
          currentHeaderRight={
            isJobStep ? (
              <GeneratePanelCopyActions text={rawJobText} />
            ) : undefined
          }
          previousMatchCurrent={previousMatchCurrent}
          swapColumns={isJobStep}
          currentFill={isJobStep}
        >
          <GenerateHistoryStepView
            step={normalizedActiveStep}
            job={job}
            combine={combine}
            resume={resume}
            evaluationMarkdown={detail.evaluationMarkdown}
          />
        </GenerateStepLayout>
      </div>
    </section>
  );
}
