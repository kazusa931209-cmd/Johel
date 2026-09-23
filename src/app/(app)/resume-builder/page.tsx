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
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { CombineTotalTenureHeader } from "@/components/generate/CombineTotalTenureHeader";
import { GenerateCombineStep } from "@/components/generate/GenerateCombineStep";
import { EditableResumePanel } from "@/components/generate/EditableResumePanel";
import { GeneralResumeEvaluateStep } from "@/components/generate/GeneralResumeEvaluateStep";
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
import { loadGenerationProcess, loadPrompts } from "@/lib/cached-settings";
import { buildGeneralEvaluateUserPrefill } from "@/lib/general-evaluate-prefill";
import {
  canReuseStoredResume,
  EMPTY_JOB_STATE,
  hasStaleDownstreamForRun,
  type GenerateSession,
} from "@/lib/generate-session";
import { claimAutoRun, releaseAutoRun } from "@/lib/generate-auto-run";
import { notifyGenerationFinalized } from "@/lib/generation-finalized-events";
import type { ResumeLanguage } from "@/lib/api";
import {
  getCombineGenerationFingerprint,
  runAiGeneralEvaluate,
  runAiGeneralResume,
} from "@/lib/api";
import { buildGeneralGenerationInputKey } from "@/lib/general-resume-input-keys";
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
  const { locale: uiLocale } = useLocale();
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
  const [generateFooter, setGenerateFooter] = useState<ReactNode | null>(null);
  const [evaluateHeaderRight, setEvaluateHeaderRight] =
    useState<ReactNode | null>(null);
  const [evaluateResumeFooter, setEvaluateResumeFooter] =
    useState<ReactNode | null>(null);
  const [evaluatePanelFooter, setEvaluatePanelFooter] =
    useState<ReactNode | null>(null);
  const [evaluateDraftUserPrompt, setEvaluateDraftUserPrompt] = useState("");
  const [evaluateUserPromptError, setEvaluateUserPromptError] = useState<
    string | null
  >(null);
  const [clearEvaluationConfirmOpen, setClearEvaluationConfirmOpen] =
    useState(false);
  const [prefillGeneralEvaluateConfirmOpen, setPrefillGeneralEvaluateConfirmOpen] =
    useState(false);
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
    evaluationHistory,
    setResumeResult,
    updateResume,
    appendEvaluationHistory,
    clearEvaluationHistory,
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

  useEffect(() => {
    if (normalizedActiveStep !== "Generate") {
      setGenerateHeaderRight(null);
      setGenerateFooter(null);
    }
  }, [normalizedActiveStep]);

  useEffect(() => {
    if (normalizedActiveStep !== "Evaluate") {
      setEvaluateHeaderRight(null);
      setEvaluateResumeFooter(null);
      setEvaluatePanelFooter(null);
      setClearEvaluationConfirmOpen(false);
      setPrefillGeneralEvaluateConfirmOpen(false);
    }
  }, [normalizedActiveStep]);

  const persistDraftResume = useCallback(async () => {
    const res = await saveSnapshot();
    if (res?.error) {
      toast(res.error, "error");
    }
  }, [saveSnapshot, toast]);

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
      evaluationMarkdown: null,
      evaluationInputKey: null,
      evaluationHistory,
      finalized: false,
      jobDuplicateDismissedHash: null,
    }),
    [
      combine,
      evaluationHistory,
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
    onResumeChange: updateResume,
    onResumePersist: persistDraftResume,
    builderKind: "general",
    generationId,
    resumeLanguage,
    combineCompanies: combine.companies,
  });

  const {
    previousTitle: panelPreviousTitle,
    previousContent,
    previousHeaderRight,
    previousFooter,
  } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps: RESUME_BUILDER_STEPS,
      doVerdict: false,
      job: EMPTY_JOB_STATE,
      combine,
      resume,
      refinePanel:
        normalizedActiveStep === "Generate" ? draftResumeSession.refinePanel : null,
      refineFooterApply:
        normalizedActiveStep === "Generate"
          ? draftResumeSession.refineFooterApply
          : null,
      evaluateResumeOnly: isEvaluateStep,
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
          await persistDraftResume();
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
      persistDraftResume,
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

  const runUserEvaluation = useCallback(async () => {
    if (evaluatingRef.current || !generationId) return;
    if (!resume) {
      toast(t("toast.noResumeForEvaluate"), "error");
      return;
    }

    const trimmed = evaluateDraftUserPrompt.trim();
    if (!trimmed) {
      setEvaluateUserPromptError(
        t("resumeBuilder.evaluateStep.userPromptRequired"),
      );
      return;
    }
    setEvaluateUserPromptError(null);

    evaluatingRef.current = true;
    setEvaluating(true);

    try {
      const res = await runAiGeneralEvaluate({
        resume,
        generationId,
        userPrompt: trimmed,
        uiLocale,
      });
      if (!res.data) {
        toast(res.error ?? t("toast.evaluateFailed"), "error");
        return;
      }

      const persistRes = await appendEvaluationHistory(
        generationId,
        trimmed,
        res.data.markdown,
      );
      if (persistRes?.error) {
        toast(persistRes.error, "error");
        return;
      }

      setEvaluateDraftUserPrompt("");
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.resumeEvaluated"), "success");
    } catch {
      toast(t("toast.evaluateFailed"), "error");
    } finally {
      evaluatingRef.current = false;
      setEvaluating(false);
    }
  }, [
    appendEvaluationHistory,
    evaluateDraftUserPrompt,
    generationId,
    refreshTokenUsed,
    resume,
    setTokenUsed,
    t,
    toast,
    uiLocale,
  ]);

  const openPrefillGeneralEvaluateConfirm = useCallback(() => {
    setPrefillGeneralEvaluateConfirmOpen(true);
  }, []);

  const confirmClearEvaluation = useCallback(async () => {
    setClearEvaluationConfirmOpen(false);
    const res = await clearEvaluationHistory();
    if (res?.error) {
      toast(res.error, "error");
    }
    openPrefillGeneralEvaluateConfirm();
  }, [clearEvaluationHistory, openPrefillGeneralEvaluateConfirm, toast]);

  const skipClearEvaluation = useCallback(() => {
    setClearEvaluationConfirmOpen(false);
    openPrefillGeneralEvaluateConfirm();
  }, [openPrefillGeneralEvaluateConfirm]);

  const confirmPrefillGeneralEvaluate = useCallback(async () => {
    setPrefillGeneralEvaluateConfirmOpen(false);
    const promptsRes = await loadPrompts();
    if (!promptsRes.data) {
      toast(promptsRes.error ?? t("toast.evaluateFailed"), "error");
      return;
    }
    const prefill = buildGeneralEvaluateUserPrefill(
      promptsRes.data.generalEvaluatePrompt,
      promptsRes.data.generalEvaluateExtension,
    );
    setEvaluateDraftUserPrompt(prefill);
    setEvaluateUserPromptError(null);
  }, [t, toast]);

  const runFromGenerate = useCallback(() => {
    if (!resume) {
      toast(t("toast.noResumeForEvaluate"), "error");
      return;
    }
    setActiveStep("Evaluate");
    if (evaluationHistory.length > 0) {
      setClearEvaluationConfirmOpen(true);
    } else {
      openPrefillGeneralEvaluateConfirm();
    }
  }, [
    evaluationHistory.length,
    openPrefillGeneralEvaluateConfirm,
    resume,
    setActiveStep,
    t,
    toast,
  ]);

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
                : isEvaluateStep && resume
                  ? t("generate.previous.resumeTitle")
                  : panelPreviousTitle ?? previousTitle
            }
            previous={
              isEvaluateStep && resume ? (
                <EditableResumePanel
                  resume={resume}
                  onResumeChange={updateResume}
                  onResumePersist={persistDraftResume}
                  onHeaderRightChange={setEvaluateHeaderRight}
                  onFooterChange={setEvaluateResumeFooter}
                />
              ) : isCombineStep ? (
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
              ) : isEvaluateStep ? (
                evaluateHeaderRight
              ) : (
                previousHeaderRight
              )
            }
            previousFooter={
              isCombineStep
                ? undefined
                : isEvaluateStep
                  ? evaluateResumeFooter
                  : previousFooter
            }
            currentTitle={getGenerateCurrentPanelTitle(
              normalizedActiveStep,
              t,
            )}
            currentFooter={
              isEvaluateStep
                ? evaluatePanelFooter
                : isGenerateStep && resume
                  ? generateFooter
                  : undefined
            }
            currentHeaderRight={
              isCombineStep ? (
                <CombineTotalTenureHeader combine={combine} />
              ) : isEvaluateStep
                ? undefined
                : isGenerateStep && resume
                  ? generateHeaderRight
                  : undefined
            }
            currentFill={
              (isGenerateStep && Boolean(resume)) ||
              (isEvaluateStep && Boolean(resume))
            }
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
                onRun={runFromGenerate}
                onResumeChange={updateResume}
                onResumePersist={persistDraftResume}
                onHeaderRightChange={setGenerateHeaderRight}
                onFooterChange={setGenerateFooter}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
            {isEvaluateStep ? (
              <GeneralResumeEvaluateStep
                resume={resume}
                downloadLabel={downloadLabel}
                resumeLanguage={resumeLanguage}
                history={evaluationHistory}
                evaluating={evaluating}
                draftUserPrompt={evaluateDraftUserPrompt}
                userPromptError={evaluateUserPromptError}
                onDraftUserPromptChange={(value) => {
                  setEvaluateDraftUserPrompt(value);
                  if (evaluateUserPromptError) {
                    setEvaluateUserPromptError(null);
                  }
                }}
                onEvaluate={runUserEvaluation}
                onFooterChange={setEvaluatePanelFooter}
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

      {clearEvaluationConfirmOpen ? (
        <ConfirmDialog
          title={t("resumeBuilder.evaluateStep.clearHistoryConfirm.title")}
          cancelLabel={t("resumeBuilder.evaluateStep.clearHistoryConfirm.no")}
          onClose={skipClearEvaluation}
          onConfirm={() => void confirmClearEvaluation()}
          confirmLabel={t("resumeBuilder.evaluateStep.clearHistoryConfirm.yes")}
        >
          <p className="text-muted">
            {t("resumeBuilder.evaluateStep.clearHistoryConfirm.body")}
          </p>
        </ConfirmDialog>
      ) : null}

      {prefillGeneralEvaluateConfirmOpen ? (
        <ConfirmDialog
          title={t("resumeBuilder.evaluateStep.prefillGeneralEvaluateConfirm.title")}
          cancelLabel={t(
            "resumeBuilder.evaluateStep.prefillGeneralEvaluateConfirm.no",
          )}
          onClose={() => setPrefillGeneralEvaluateConfirmOpen(false)}
          onConfirm={() => void confirmPrefillGeneralEvaluate()}
          confirmLabel={t(
            "resumeBuilder.evaluateStep.prefillGeneralEvaluateConfirm.yes",
          )}
        >
          <p className="text-muted">
            {t("resumeBuilder.evaluateStep.prefillGeneralEvaluateConfirm.body")}
          </p>
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
