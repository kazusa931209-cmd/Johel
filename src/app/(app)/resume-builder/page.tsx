"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { CombineTotalTenureHeader } from "@/components/generate/CombineTotalTenureHeader";
import { GenerateCombineStep } from "@/components/generate/GenerateCombineStep";
import { GenerateEvaluateStep } from "@/components/generate/GenerateEvaluateStep";
import { DraftResumeRefiningOverlay } from "@/components/generate/DraftResumeRefiningOverlay";
import { GenerateGenerateStep } from "@/components/generate/GenerateGenerateStep";
import { useGenerateDraftResumeSession } from "@/components/generate/useGenerateDraftResumeSession";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import {
  GeneralResumeUserInstructionPanel,
  formatGeneralResumeUserInstructionCount,
  type GeneralResumeUserInstructionFlushResult,
} from "@/components/generate/GeneralResumeUserInstructionPanel";
import {
  GenerateNewButton,
  GenerateStepNavProvider,
  GenerateStepNavRunButton,
} from "@/components/generate/GenerateStepNav";
import { useGeneralResumeSession } from "@/components/generate/useGeneralResumeSession";
import { loadGenerationProcess } from "@/lib/cached-settings";
import {
  canReuseStoredEvaluation,
  canReuseStoredResume,
  EMPTY_JOB_STATE,
  hasStaleDownstreamForRun,
  type GenerateSession,
} from "@/lib/generate-session";
import {
  claimAutoRun,
  releaseAutoRun,
} from "@/lib/generate-auto-run";
import { notifyGenerationFinalized } from "@/lib/generation-finalized-events";
import type { ResumeLanguage } from "@/lib/api";
import {
  getCombineGenerationFingerprint,
  runAiGeneralEvaluate,
  runAiGeneralResume,
} from "@/lib/api";
import {
  buildGeneralEvaluationInputKey,
  buildGeneralGenerationInputKey,
} from "@/lib/general-resume-input-keys";
import {
  getAdjacentGenerateStep,
  getGenerateCurrentPanelTitle,
} from "@/lib/generate-steps";
import {
  normalizeResumeBuilderActiveStep,
  needsNewGeneralResumeConfirm,
  RESUME_BUILDER_STEPS,
} from "@/lib/resume-builder-steps";

export default function ResumeBuilderPage() {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const generatingResumeRef = useRef(false);
  const evaluatingRef = useRef(false);
  const pendingRunRef = useRef<(() => void) | null>(null);
  const [resumeLanguage, setResumeLanguage] = useState<ResumeLanguage>("en");
  const [generateHeaderRight, setGenerateHeaderRight] =
    useState<ReactNode | null>(null);
  const userInstructionFlushRef = useRef<
    (() => GeneralResumeUserInstructionFlushResult | null) | null
  >(null);

  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    combine,
    setCombine,
    resume,
    resumeAiSnapshot,
    generationId,
    generationPublicId,
    generationInputKey,
    evaluationInputKey,
    evaluationMarkdown,
    setResumeResult,
    updateResume,
    setEvaluationResult,
    clearDownstreamFromGenerateSession,
    saveSnapshot,
    resetSession,
    markFinalized,
  } = useGeneralResumeSession();

  const normalizedActiveStep = useMemo(
    () => normalizeResumeBuilderActiveStep(activeStep),
    [activeStep],
  );

  const isCombineStep = normalizedActiveStep === "Combine";
  const isGenerateStep = normalizedActiveStep === "Generate";
  const isEvaluateStep = normalizedActiveStep === "Evaluate";

  useEffect(() => {
    let cancelled = false;
    void loadGenerationProcess().then((res) => {
      if (cancelled || !res.data?.resumeLanguage) return;
      setResumeLanguage(res.data.resumeLanguage);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (normalizedActiveStep !== activeStep) {
      setActiveStep(normalizedActiveStep);
    }
  }, [activeStep, normalizedActiveStep, sessionReady, setActiveStep]);

  useEffect(() => {
    if (!sessionReady) return;
    if (combine.language === resumeLanguage) return;
    setCombine({ ...combine, language: resumeLanguage });
  }, [combine, resumeLanguage, sessionReady, setCombine]);

  const sessionSnapshot = useMemo<GenerateSession>(
    () => ({
      generationId,
      generationPublicId,
      activeStep: normalizedActiveStep,
      job: EMPTY_JOB_STATE,
      combine,
      verdictInputKey: null,
      resume,
      resumeAiSnapshot,
      generationInputKey,
      evaluationMarkdown,
      evaluationInputKey,
      finalized: false,
      jobDuplicateDismissedHash: null,
    }),
    [
      combine,
      evaluationInputKey,
      evaluationMarkdown,
      generationId,
      generationInputKey,
      generationPublicId,
      normalizedActiveStep,
      resume,
      resumeAiSnapshot,
    ],
  );

  const requestRun = useCallback(
    (fromStep: typeof normalizedActiveStep, action: () => void | Promise<void>) => {
      if (hasStaleDownstreamForRun(sessionSnapshot, fromStep)) {
        pendingRunRef.current = () => {
          void action();
        };
        setRunConfirmOpen(true);
        return;
      }
      void action();
    },
    [sessionSnapshot],
  );

  const previousStep = useMemo(
    () =>
      getAdjacentGenerateStep(
        RESUME_BUILDER_STEPS,
        normalizedActiveStep,
        "prev",
      ),
    [normalizedActiveStep],
  );

  const previousTitle = previousStep
    ? getGenerateCurrentPanelTitle(previousStep, t)
    : undefined;

  const draftResumeSession = useGenerateDraftResumeSession({
    resume,
    generationInputKey,
    onResumeChange: updateResume,
    builderKind: "general",
    generationId,
    resumeLanguage,
    combineCompanies: combine.companies,
  });

  const { previousTitle: panelPreviousTitle, previousContent, previousHeaderRight } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps: RESUME_BUILDER_STEPS,
      doVerdict: false,
      job: EMPTY_JOB_STATE,
      combine,
      resume,
      refinePanel:
        normalizedActiveStep === "Generate" ? draftResumeSession.refinePanel : null,
      refineHeaderApply:
        normalizedActiveStep === "Generate"
          ? draftResumeSession.refineHeaderApply
          : null,
    });

  const onSaveBeforeSuggest = useCallback(
    async (snapshot: CombineSnapshot) => {
      setCombine(snapshot);
      return saveSnapshot();
    },
    [saveSnapshot, setCombine],
  );

  const runResumeGeneration = useCallback(
    async (options?: { force?: boolean }) => {
      if (generatingResumeRef.current || !generationId) return;
      generatingResumeRef.current = true;
      setGeneratingResume(true);

      try {
        const fingerprintRes = await getCombineGenerationFingerprint(combine);
        if (!fingerprintRes.data?.fingerprint) {
          toast(
            fingerprintRes.error ?? t("toast.combineFingerprintFailed"),
            "error",
          );
          return;
        }

        const inputKey = buildGeneralGenerationInputKey(
          generationId,
          combine,
          fingerprintRes.data.fingerprint,
        );
        if (
          !options?.force &&
          canReuseStoredResume(sessionSnapshot, inputKey)
        ) {
          return;
        }

        const autoRunKey = `general:generate:resume:${inputKey}`;
        if (!claimAutoRun(autoRunKey)) {
          return;
        }

        try {
          const res = await runAiGeneralResume({
            combine,
            generationId,
          });
          if (!res.data) {
            toast(res.error ?? t("toast.resumeGenerateFailed"), "error");
            return;
          }

          setResumeResult(res.data.resume, inputKey);
          setTokenUsed(res.data.tokenUsed);
          await refreshTokenUsed();
          toast(t("toast.resumeGenerated"), "success");
        } finally {
          releaseAutoRun(autoRunKey);
        }
      } catch {
        toast(t("toast.resumeGenerateFailed"), "error");
      } finally {
        generatingResumeRef.current = false;
        setGeneratingResume(false);
      }
    },
    [
      combine,
      generationId,
      refreshTokenUsed,
      sessionSnapshot,
      setResumeResult,
      setTokenUsed,
      t,
      toast,
    ],
  );

  const runFromCombine = useCallback(() => {
    requestRun("Combine", async () => {
      clearDownstreamFromGenerateSession();
      setActiveStep("Generate");
      await runResumeGeneration({ force: true });
    });
  }, [
    clearDownstreamFromGenerateSession,
    requestRun,
    runResumeGeneration,
    setActiveStep,
  ]);

  const runEvaluation = useCallback(async () => {
    if (evaluatingRef.current || !generationId) return;
    evaluatingRef.current = true;
    setEvaluating(true);

    try {
      if (!resume || !generationInputKey) {
        toast(t("toast.noResumeForEvaluate"), "error");
        return;
      }

      const fingerprintRes = await getCombineGenerationFingerprint(combine);
      if (!fingerprintRes.data?.fingerprint) {
        toast(
          fingerprintRes.error ?? t("toast.evaluationFingerprintFailed"),
          "error",
        );
        return;
      }

      const currentInputKey = buildGeneralGenerationInputKey(
        generationId,
        combine,
        fingerprintRes.data.fingerprint,
      );
      if (currentInputKey !== generationInputKey) {
        toast(t("toast.combineContentChanged"), "error");
        return;
      }

      const nextEvaluationInputKey = buildGeneralEvaluationInputKey(
        generationId,
        combine,
        fingerprintRes.data.fingerprint,
        resume,
      );
      if (canReuseStoredEvaluation(sessionSnapshot, nextEvaluationInputKey)) {
        return;
      }

      const autoRunKey = `general:generate:evaluate:${nextEvaluationInputKey}`;
      if (!claimAutoRun(autoRunKey)) {
        return;
      }

      try {
        const res = await runAiGeneralEvaluate({
          resume,
          generationId,
        });
        if (!res.data) {
          toast(res.error ?? t("toast.evaluateFailed"), "error");
          return;
        }

        setEvaluationResult(res.data.markdown, nextEvaluationInputKey);
        setTokenUsed(res.data.tokenUsed);
        await refreshTokenUsed();
        toast(t("toast.resumeEvaluated"), "success");
      } finally {
        releaseAutoRun(autoRunKey);
      }
    } catch {
      toast(t("toast.evaluateFailed"), "error");
    } finally {
      evaluatingRef.current = false;
      setEvaluating(false);
    }
  }, [
    combine,
    generationId,
    generationInputKey,
    refreshTokenUsed,
    resume,
    sessionSnapshot,
    setEvaluationResult,
    setTokenUsed,
    t,
    toast,
  ]);

  const runFromGenerate = useCallback(() => {
    requestRun("Generate", async () => {
      if (!resume) {
        toast(t("toast.noResumeForEvaluate"), "error");
        return;
      }
      setActiveStep("Evaluate");
      await runEvaluation();
    });
  }, [requestRun, resume, runEvaluation, setActiveStep, t, toast]);

  const downloadLabel = useMemo(
    () => ({
      publicId: generationPublicId,
      jdCompanyName: combine.platform.trim() || undefined,
      jdJobRole: undefined,
    }),
    [combine.platform, generationPublicId],
  );

  const handleResumeDownloaded = useCallback(async () => {
    markFinalized();
    const result = await saveSnapshot(true);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    if (generationPublicId) {
      notifyGenerationFinalized(generationPublicId);
    }
  }, [generationPublicId, markFinalized, saveSnapshot, toast]);

  const runNewGeneration = useCallback(async () => {
    setResetting(true);
    const result = await resetSession();
    setResetting(false);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    setNewConfirmOpen(false);
  }, [resetSession, toast]);

  const requestNewGeneration = useCallback(() => {
    if (resetting || generatingResume || evaluating) return;
    if (needsNewGeneralResumeConfirm(normalizedActiveStep)) {
      setNewConfirmOpen(true);
      return;
    }
    void runNewGeneration();
  }, [
    evaluating,
    generatingResume,
    normalizedActiveStep,
    resetting,
    runNewGeneration,
  ]);

  const confirmRunWithStaleDownstream = useCallback(() => {
    const action = pendingRunRef.current;
    pendingRunRef.current = null;
    setRunConfirmOpen(false);
    action?.();
  }, []);

  const userInstructionCharCount = useMemo(
    () => formatGeneralResumeUserInstructionCount(combine.userInstruction.length),
    [combine.userInstruction.length],
  );

  if (!sessionReady) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("generate.loading")}
      </main>
    );
  }

  return (
    <GenerateStepNavProvider>
      <section className="-m-6 flex h-[calc(100dvh-3.5rem)] w-auto flex-col overflow-hidden">
        <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <GenerateNewButton
              onClick={requestNewGeneration}
              disabled={resetting || generatingResume || evaluating}
            />
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_3.5rem] items-center gap-3">
              <GenerateTimeline
                active={normalizedActiveStep}
                steps={RESUME_BUILDER_STEPS}
                onStepSelect={setActiveStep}
              />
              <GenerateStepNavRunButton />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 pt-6 pb-6">
          <GenerateStepLayout
            previousTitle={
              isCombineStep
                ? t("resumeBuilder.combine.userInstructionTitle")
                : panelPreviousTitle ?? previousTitle
            }
            previous={
              isCombineStep ? (
                <GeneralResumeUserInstructionPanel
                  userInstruction={combine.userInstruction}
                  platform={combine.platform}
                  onUserInstructionChange={(userInstruction) =>
                    setCombine({ ...combine, userInstruction })
                  }
                  onPlatformChange={(platform) =>
                    setCombine({ ...combine, platform })
                  }
                  onRegisterFlush={(flush) => {
                    userInstructionFlushRef.current = flush;
                  }}
                />
              ) : (
                previousContent
              )
            }
            previousHeaderRight={
              isCombineStep ? (
                <span className="text-xs tabular-nums text-muted">
                  {userInstructionCharCount}
                </span>
              ) : (
                previousHeaderRight
              )
            }
            currentTitle={getGenerateCurrentPanelTitle(
              normalizedActiveStep,
              t,
            )}
            currentHeaderRight={
              isCombineStep ? (
                <CombineTotalTenureHeader combine={combine} />
              ) : isGenerateStep && resume ? (
                generateHeaderRight
              ) : undefined
            }
            currentFill={isGenerateStep && Boolean(resume)}
          >
            {isCombineStep ? (
              <GenerateCombineStep
                variant="general"
                combine={combine}
                onCombineChange={setCombine}
                job={EMPTY_JOB_STATE}
                onJobChange={() => {}}
                doVerdict={false}
                generationId={generationId}
                onSaveBeforeSuggest={onSaveBeforeSuggest}
                onRunFromCombine={runFromCombine}
                flushUserInstruction={() =>
                  userInstructionFlushRef.current?.() ?? null
                }
              />
            ) : null}
            {isGenerateStep ? (
              <GenerateGenerateStep
                resume={resume}
                downloadLabel={downloadLabel}
                resumeLanguage={resumeLanguage}
                doEvaluate={true}
                generating={generatingResume}
                canUndo={draftResumeSession.canUndo}
                canRedo={draftResumeSession.canRedo}
                onUndo={draftResumeSession.handleUndo}
                onRedo={draftResumeSession.handleRedo}
                onDraftCommitted={draftResumeSession.pushDraftHistory}
                onRun={runFromGenerate}
                onResumeChange={updateResume}
                onHeaderRightChange={setGenerateHeaderRight}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
            {isEvaluateStep ? (
              <GenerateEvaluateStep
                generationId={generationId}
                resume={resume}
                downloadLabel={downloadLabel}
                resumeLanguage={resumeLanguage}
                evaluationMarkdown={evaluationMarkdown}
                evaluating={evaluating}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
          </GenerateStepLayout>
        </div>
      </section>

      {newConfirmOpen ? (
        <ConfirmDialog
          title={t("generate.newConfirm.title")}
          closeDisabled={resetting}
          confirmDisabled={resetting}
          onClose={() => setNewConfirmOpen(false)}
          onConfirm={() => void runNewGeneration()}
          confirmLabel={
            resetting ? t("generate.newConfirm.confirming") : t("generate.new")
          }
        >
          <p className="text-muted">{t("generate.newConfirm.body")}</p>
        </ConfirmDialog>
      ) : null}

      {runConfirmOpen ? (
        <ConfirmDialog
          title={t("generate.runConfirm.title")}
          onClose={() => {
            pendingRunRef.current = null;
            setRunConfirmOpen(false);
          }}
          onConfirm={confirmRunWithStaleDownstream}
          confirmLabel={t("generate.runConfirm.confirm")}
        >
          <p className="text-muted">{t("generate.runConfirm.body")}</p>
        </ConfirmDialog>
      ) : null}

      {isGenerateStep && draftResumeSession.refining ? (
        <DraftResumeRefiningOverlay />
      ) : null}
      {isGenerateStep && generatingResume && !resume ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.generateStep.generating.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.generateStep.generating.description")}
            </p>
          </div>
        </div>
      ) : null}
    </GenerateStepNavProvider>
  );
}
