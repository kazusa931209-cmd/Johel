"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseGeneratedResume } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { GenerateHistoryStepView } from "@/components/generate/GenerateHistoryStepView";
import { GeneratePanelCopyActions } from "@/components/generate/GeneratePanelCopyActions";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import { GenerateCircleIconButton } from "@/components/generate/GenerateStepNav";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import {
  GenerateTimeline,
  type GenerateStep,
} from "@/components/generate/GenerateTimeline";
import { useResumeDocxDownload } from "@/components/generate/useResumeDocxDownload";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { Drawer } from "@/components/shared/drawer";
import { DownloadIcon, PlayIcon } from "@/components/shared/icons";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  getGeneration,
  getGenerationProcess,
  getMe,
  updateGeneration,
  type GenerationDetail,
} from "@/lib/api";
import { notifyGenerationFinalized } from "@/lib/generation-finalized-events";
import { loadGenerateSession, type GenerateJobState } from "@/lib/generate-session";
import { resumeGenerationFromHistory } from "@/lib/generation-persistence";
import {
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "@/lib/generate-steps";
import { formatThousandsSeparated } from "@/lib/helper";
import { noiseFilter } from "@/lib/jobNoiseFilter";

const HISTORY_DRAWER_WIDTH = "w-[80vw]";

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

type GenerationHistoryDrawerProps = {
  publicId: string | null;
  open: boolean;
  onClose: () => void;
  onDetailUpdated?: () => void;
};

export function GenerationHistoryDrawer({
  publicId,
  open,
  onClose,
  onDetailUpdated,
}: GenerationHistoryDrawerProps) {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<GenerationDetail | null>(null);
  const [activeStep, setActiveStep] = useState<GenerateStep>("Job");
  const [userId, setUserId] = useState<string | null>(null);
  const [doEvaluate, setDoEvaluate] = useState(true);
  const [currentPublicId, setCurrentPublicId] = useState<string | null>(null);
  const [resumeConfirmOpen, setResumeConfirmOpen] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getMe(), getGenerationProcess()]).then(
      ([meRes, processRes]) => {
        if (cancelled) return;
        const id = meRes.data?.id ?? null;
        setUserId(id);
        if (processRes.data) {
          setDoEvaluate(processRes.data.doEvaluate);
        }
        if (id) {
          const session = loadGenerateSession(id);
          setCurrentPublicId(session?.generationPublicId ?? null);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open || !publicId) {
      setDetail(null);
      setActiveStep("Job");
      return;
    }

    let cancelled = false;
    setLoading(true);
    void getGeneration(publicId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyDetailLoadFailed"), "error");
        setDetail(null);
        return;
      }
      setDetail(res.data);
      setActiveStep(
        normalizeGenerateActiveStep(
          res.data.activeStep as GenerateStep,
          res.data.doEvaluate,
          res.data.doVerdict,
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [open, publicId, t, toast]);

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

  async function handleHistoryDownloaded() {
    if (!detail) return;
    const res = await updateGeneration(detail.id, {
      activeStep: detail.activeStep,
      job: detail.job,
      combine: detail.combine,
      verdictMarkdown: detail.verdictMarkdown,
      resume: detail.resume,
      evaluationMarkdown: detail.evaluationMarkdown,
      finalized: true,
    });
    if (res.data) {
      setDetail(res.data);
      notifyGenerationFinalized(res.data.publicId);
      onDetailUpdated?.();
    }
  }

  const { onDownload, downloading } = useResumeDocxDownload(resume, runLabel, {
    onDownloaded: handleHistoryDownloaded,
  });
  const showDownload = resume != null;

  async function confirmResume() {
    if (!detail || !userId) return;
    setResuming(true);
    const result = await resumeGenerationFromHistory(
      detail.publicId,
      userId,
    );
    setResuming(false);
    if (result.error) {
      toast(result.error ?? t("toast.generationResumeFailed"), "error");
      return;
    }
    setResumeConfirmOpen(false);
    setCurrentPublicId(detail.publicId);
    toast(t("toast.generationResumed"), "success");
    onClose();
    router.push("/");
  }

  const resumeConfirmBody =
    currentPublicId && currentPublicId !== detail?.publicId
      ? t("history.resumeConfirm.body", {
          currentId: currentPublicId,
          targetId: detail?.publicId ?? "",
        })
      : t("history.resumeConfirm.bodyNoCurrent", {
          targetId: detail?.publicId ?? "",
        });

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

  const drawerTitle = detail?.publicId ?? publicId ?? t("history.detail.title");

  return (
    <>
      <Drawer
        title={drawerTitle}
        open={open}
        onClose={onClose}
        widthClass={HISTORY_DRAWER_WIDTH}
      >
        <div className="flex h-full min-h-0 flex-col">
          {loading ? (
            <p className="p-4 text-sm text-muted">{t("crud.common.loading")}</p>
          ) : !detail ? (
            <p className="p-4 text-sm text-muted">
              {t("history.detail.notFound")}
            </p>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-4">
                <div className="min-w-0 flex-1">
                  <GenerateTimeline
                    active={normalizedActiveStep}
                    steps={visibleSteps}
                    onStepSelect={setActiveStep}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {showDownload ? (
                    <GenerateCircleIconButton
                      onClick={() => void onDownload()}
                      disabled={downloading}
                      busy={downloading}
                      ariaLabel={t("generate.nav.download")}
                      icon={<DownloadIcon className="h-6 w-6" />}
                    />
                  ) : null}
                  <GenerateCircleIconButton
                    onClick={() => setResumeConfirmOpen(true)}
                    disabled={resuming}
                    busy={resuming}
                    ariaLabel={t("shared.actions.resume")}
                    icon={<PlayIcon className="h-6 w-6" />}
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
            </>
          )}
        </div>
      </Drawer>

      {resumeConfirmOpen ? (
        <DetailDialog
          title={t("history.resumeConfirm.title")}
          role="alertdialog"
          closeDisabled={resuming}
          onClose={() => setResumeConfirmOpen(false)}
        >
          <p className="text-muted">{resumeConfirmBody}</p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={resuming}
              onClick={() => void confirmResume()}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
            >
              {resuming
                ? t("history.resumeConfirm.confirming")
                : t("history.resumeConfirm.confirm")}
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </>
  );
}
