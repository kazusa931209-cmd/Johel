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
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CombineTotalTenureHeader } from "@/components/generate/CombineTotalTenureHeader";
import { GenerateCombineStep } from "@/components/generate/GenerateCombineStep";
import { GenerateGenerateStep } from "@/components/generate/GenerateGenerateStep";
import { GenerateEvaluateStep } from "@/components/generate/GenerateEvaluateStep";
import {
  GeneratePrerequisites,
  type MissingPrerequisite,
} from "@/components/generate/GeneratePrerequisites";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { GenerateJobDuplicateDialog } from "@/components/generate/GenerateJobDuplicateDialog";
import { GenerateJobStep } from "@/components/generate/GenerateJobStep";
import { useJobDuplicateFlow } from "@/components/generate/useJobDuplicateFlow";
import { useGeneratePreviousStepPanel } from "@/components/generate/GeneratePreviousStepPanel";
import { GenerateStepLayout } from "@/components/generate/GenerateStepLayout";
import { GenerateVerdictStep } from "@/components/generate/GenerateVerdictStep";
import {
  GenerateNewButton,
  GenerateStepNavProvider,
  GenerateStepNavRunButton,
} from "@/components/generate/GenerateStepNav";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import { useGenerateSession } from "@/components/generate/useGenerateSession";
import { notifyGenerationFinalized } from "@/lib/generation-finalized-events";
import {
  buildEvaluationInputKey,
  buildGenerationInputKey,
  buildResumeJobContext,
  buildVerdictInputKey,
  canReuseStoredEvaluation,
  canReuseStoredResume,
  canReuseStoredVerdict,
  hasStaleDownstreamForRun,
  type GenerateSession,
} from "@/lib/generate-session";
import {
  getGenerateCurrentPanelTitle,
  getGenerateSteps,
  needsNewGenerationConfirm,
  normalizeGenerateActiveStep,
} from "@/lib/generate-steps";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  claimAutoRun,
  isAutoRunInFlight,
  releaseAutoRun,
} from "@/lib/generate-auto-run";
import { extractJdMetaFromVerdictMarkdown } from "@johel/jd-meta";
import {
  getCombineGenerationFingerprint,
  runAiEvaluate,
  runAiJdMetaExtract,
  runAiResume,
  runAiVerdict,
  type ResumeLanguage,
} from "@/lib/api";
import { loadGenerationProcess, loadPrompts } from "@/lib/cached-settings";
import { loadPce } from "@/lib/pce";

const DEFAULT_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
  resumeLanguage: "en" as ResumeLanguage,
};

const DEFAULT_PROMPTS = {
  verdictPrompt: "",
  generatePrompt: "",
  evaluatePrompt: "",
};

export default function GeneratePage() {
  const { toast } = useToast();
  const t = useT();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [loading, setLoading] = useState(true);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const generatingResumeRef = useRef(false);
  const evaluatingRef = useRef(false);
  const [verdictRunning, setVerdictRunning] = useState(false);
  const [jdMetaRunning, setJdMetaRunning] = useState(false);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [processSettings, setProcessSettings] = useState(DEFAULT_PROCESS);
  const [promptSettings, setPromptSettings] = useState(DEFAULT_PROMPTS);
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingJob, setResettingJob] = useState(false);
  const [combineFooter, setCombineFooter] = useState<ReactNode | null>(null);
  const [generateHeaderRight, setGenerateHeaderRight] =
    useState<ReactNode | null>(null);
  const pendingRunRef = useRef<(() => void) | null>(null);
  const {
    ready: sessionReady,
    userId,
    generationId,
    generationPublicId,
    activeStep,
    setActiveStep,
    job,
    setJob,
    combine,
    setCombine,
    verdictInputKey,
    setVerdictResult,
    resume,
    resumeAiSnapshot,
    generationInputKey,
    setResumeResult,
    updateResume,
    evaluationMarkdown,
    evaluationInputKey,
    setEvaluationResult,
    clearDownstreamFromVerdictSession,
    clearDownstreamFromGenerateSession,
    saveSnapshot,
    resetSession,
    markFinalized,
    finalized,
    jobDuplicateDismissedHash,
    dismissJobDuplicateCheck,
    restoreSession,
    clearJobAndPersist,
  } = useGenerateSession();

  const visibleSteps = useMemo(
    () =>
      getGenerateSteps(
        processSettings.doEvaluate,
        processSettings.doVerdict,
      ),
    [processSettings.doEvaluate, processSettings.doVerdict],
  );

  const normalizedActiveStep = useMemo(
    () =>
      normalizeGenerateActiveStep(
        activeStep,
        processSettings.doEvaluate,
        processSettings.doVerdict,
      ),
    [activeStep, processSettings.doEvaluate, processSettings.doVerdict],
  );

  useEffect(() => {
    if (!sessionReady) return;
    if (normalizedActiveStep !== activeStep) {
      setActiveStep(normalizedActiveStep);
    }
  }, [activeStep, normalizedActiveStep, sessionReady, setActiveStep]);

  useEffect(() => {
    if (normalizedActiveStep !== "Combine") {
      setCombineFooter(null);
    }
  }, [normalizedActiveStep]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadPce(),
      loadPrompts(),
      loadGenerationProcess(),
    ]).then(([pceRes, prompts, process]) => {
      if (cancelled) return;
      const errors = [
        pceRes.error,
        prompts.error,
        process.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        toast(errors[0] ?? t("toast.prerequisitesCheckFailed"), "error");
        setLoading(false);
        setMissing([
          {
            label: t("generate.prerequisites.labels.profiles"),
            href: "/profiles",
          },
          {
            label: t("generate.prerequisites.labels.prompts"),
            href: "/settings/prompts?tab=generate",
          },
        ]);
        return;
      }

      const nextProcess = {
        doVerdict: process.data?.doVerdict ?? DEFAULT_PROCESS.doVerdict,
        doEvaluate: process.data?.doEvaluate ?? DEFAULT_PROCESS.doEvaluate,
        resumeLanguage:
          process.data?.resumeLanguage ?? DEFAULT_PROCESS.resumeLanguage,
      };
      setProcessSettings(nextProcess);
      setPromptSettings({
        verdictPrompt: prompts.data?.verdictPrompt ?? "",
        generatePrompt: prompts.data?.generatePrompt ?? "",
        evaluatePrompt: prompts.data?.evaluatePrompt ?? "",
      });

      const pce = pceRes.data;
      const nextMissing: MissingPrerequisite[] = [];
      if ((pce?.profiles.length ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.profiles"),
          href: "/profiles",
        });
      }
      if ((pce?.companies.length ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.companies"),
          href: "/companies",
        });
      }
      if ((pce?.experiences.length ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.experiences"),
          href: "/experiences",
        });
      }
      if (nextProcess.doVerdict && !prompts.data?.verdictPrompt.trim()) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.verdictPrompt"),
          href: "/settings/prompts?tab=verdict",
        });
      }
      if (!prompts.data?.generatePrompt.trim()) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.generatePrompt"),
          href: "/settings/prompts?tab=generate",
        });
      }
      if (nextProcess.doEvaluate && !prompts.data?.evaluatePrompt.trim()) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.evaluatePrompt"),
          href: "/settings/prompts?tab=evaluate",
        });
      }

      setMissing(nextMissing.length > 0 ? nextMissing : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  useEffect(() => {
    if (!sessionReady || loading) return;
    if (combine.language === processSettings.resumeLanguage) return;
    setCombine({ ...combine, language: processSettings.resumeLanguage });
  }, [
    sessionReady,
    loading,
    processSettings.resumeLanguage,
    combine,
    setCombine,
  ]);

  useEffect(() => {
    if (normalizedActiveStep !== "Generate") {
      setGenerateHeaderRight(null);
    }
  }, [normalizedActiveStep]);

  useEffect(() => {
    if (!sessionReady || loading || !generationId) return;
    const timer = window.setTimeout(() => {
      void saveSnapshot(finalized ? true : undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    combine,
    evaluationMarkdown,
    finalized,
    generationId,
    job,
    loading,
    normalizedActiveStep,
    resume,
    saveSnapshot,
    sessionReady,
  ]);

  const handleResumeDownloaded = useCallback(async () => {
    markFinalized();
    await saveSnapshot(true);
    if (generationPublicId) {
      notifyGenerationFinalized(generationPublicId);
    }
  }, [generationPublicId, markFinalized, saveSnapshot]);

  const sessionSnapshot = useMemo<GenerateSession>(
    () => ({
      generationId,
      generationPublicId,
      activeStep: normalizedActiveStep,
      job,
      combine,
      verdictInputKey,
      resume,
      resumeAiSnapshot,
      generationInputKey,
      evaluationMarkdown,
      evaluationInputKey,
      finalized,
      jobDuplicateDismissedHash,
    }),
    [
      combine,
      evaluationInputKey,
      evaluationMarkdown,
      finalized,
      generationId,
      generationPublicId,
      generationInputKey,
      job,
      jobDuplicateDismissedHash,
      normalizedActiveStep,
      resume,
      resumeAiSnapshot,
      verdictInputKey,
    ],
  );

  const requestRun = useCallback(
    (fromStep: GenerateStep, action: () => void | Promise<void>) => {
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

  const promptCacheContext = useMemo(
    () => ({
      verdictPrompt: promptSettings.verdictPrompt,
      generatePrompt: promptSettings.generatePrompt,
      evaluatePrompt: promptSettings.evaluatePrompt,
    }),
    [promptSettings],
  );

  const onSaveBeforeSuggest = useCallback(async () => {
    const res = await saveSnapshot();
    if (res?.error) {
      return { error: res.error ?? t("toast.generationSaveFailed") };
    }
    return {};
  }, [saveSnapshot, t]);

  const runVerdict = useCallback(async () => {
    const filtered = noiseFilter(job.jobText.trim()).text;
    const inputKey = buildVerdictInputKey(job, promptCacheContext);
    if (canReuseStoredVerdict({ job, verdictInputKey }, inputKey)) {
      if (job.acceptedMarkdown) {
        const jdMeta = extractJdMetaFromVerdictMarkdown(job.acceptedMarkdown);
        setJob({
          ...job,
          jdCompanyName: jdMeta.jdCompanyName,
          jdJobRole: jdMeta.jdJobRole,
        });
      }
      return;
    }

    const autoRunKey = `verdict:${inputKey}`;
    if (!claimAutoRun(autoRunKey)) {
      if (isAutoRunInFlight(autoRunKey)) {
        setVerdictRunning(true);
      }
      return;
    }

    setVerdictRunning(true);
    try {
      const res = await runAiVerdict(filtered, generationId);
      if (!res.data) {
        toast(res.error ?? t("toast.verdictFailed"), "error");
        return;
      }

      setVerdictResult(res.data.markdown, inputKey, {
        jdCompanyName: res.data.jdCompanyName,
        jdJobRole: res.data.jdJobRole,
      });
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.verdictCompleted"), "success");
    } catch {
      toast(t("toast.verdictFailed"), "error");
    } finally {
      releaseAutoRun(autoRunKey);
      setVerdictRunning(false);
    }
  }, [
    generationId,
    job,
    promptCacheContext,
    refreshTokenUsed,
    setTokenUsed,
    setJob,
    setVerdictResult,
    t,
    toast,
    verdictInputKey,
  ]);

  const proceedToVerdict = useCallback(async () => {
    setActiveStep("Verdict");
    await runVerdict();
  }, [runVerdict, setActiveStep]);

  const {
    checking: jobDuplicateChecking,
    dialogBusy: jobDuplicateDialogBusy,
    dialogOpen: jobDuplicateDialogOpen,
    match: jobDuplicateMatch,
    newFilteredJobText: jobDuplicateNewFilteredJobText,
    checkBeforeVerdict,
    closeDialog: closeJobDuplicateDialog,
    handleCancel: handleJobDuplicateCancel,
    handleContinue: handleJobDuplicateContinue,
    handleSwitch: handleJobDuplicateSwitch,
  } = useJobDuplicateFlow({
    generationId,
    userId,
    job,
    jobDuplicateDismissedHash,
    dismissJobDuplicateCheck,
    restoreSession,
    setActiveStep,
    saveSnapshot,
    clearJobAndPersist,
    proceedToVerdict,
    toast,
    t,
  });

  const processBusy =
    verdictRunning ||
    jdMetaRunning ||
    generatingResume ||
    evaluating ||
    jobDuplicateChecking ||
    jobDuplicateDialogBusy ||
    resettingJob;

  const jobIsEmpty = useMemo(
    () => !job.jobText.trim() && !job.acceptedMarkdown?.trim(),
    [job],
  );

  const onResetJob = useCallback(async () => {
    setResettingJob(true);
    const res = await clearJobAndPersist();
    setResettingJob(false);
    if (res?.error) {
      toast(res.error ?? t("toast.generationSaveFailed"), "error");
      return;
    }
    toast(t("toast.jobResetSuccess"), "success");
  }, [clearJobAndPersist, t, toast]);

  const runFromJob = useCallback(() => {
    requestRun("Job", async () => {
      clearDownstreamFromVerdictSession();
      if (processSettings.doVerdict) {
        const shouldProceed = await checkBeforeVerdict();
        if (shouldProceed) {
          await proceedToVerdict();
        }
        return;
      }

      const filtered = noiseFilter(job.jobText.trim()).text;
      setJdMetaRunning(true);
      try {
        const res = await runAiJdMetaExtract(filtered, generationId);
        if (!res.data) {
          toast(res.error ?? t("toast.jdMetaFailed"), "error");
          return;
        }

        setJob({
          ...job,
          acceptedMarkdown: null,
          jdCompanyName: res.data.jdCompanyName,
          jdJobRole: res.data.jdJobRole,
        });
        setTokenUsed(res.data.tokenUsed);
        await refreshTokenUsed();
        toast(t("toast.jdMetaCompleted"), "success");
        setActiveStep("Combine");
      } catch {
        toast(t("toast.jdMetaFailed"), "error");
      } finally {
        setJdMetaRunning(false);
      }
    });
  }, [
    checkBeforeVerdict,
    clearDownstreamFromVerdictSession,
    generationId,
    job,
    proceedToVerdict,
    processSettings.doVerdict,
    refreshTokenUsed,
    requestRun,
    setActiveStep,
    setJob,
    setTokenUsed,
    t,
    toast,
  ]);

  const runFromVerdict = useCallback(() => {
    setActiveStep("Combine");
  }, [setActiveStep]);

  const runResumeGeneration = useCallback(async (options?: { force?: boolean }) => {
    if (generatingResumeRef.current) return;
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

      const inputKey = buildGenerationInputKey(
        job,
        processSettings.doVerdict,
        combine,
        fingerprintRes.data.fingerprint,
        promptCacheContext,
      );
      if (
        !options?.force &&
        canReuseStoredResume(
          sessionSnapshot,
          inputKey,
        )
      ) {
        return;
      }

      const jobContext = buildResumeJobContext(job, processSettings.doVerdict);
      if (processSettings.doVerdict && !jobContext) {
        toast(t("toast.verdictMissing"), "error");
        return;
      }

      const autoRunKey = `generate:resume:${inputKey}`;
      if (!claimAutoRun(autoRunKey)) {
        return;
      }

      try {
        const res = await runAiResume({
          jobContext,
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
  }, [
    combine,
    evaluationInputKey,
    evaluationMarkdown,
    generationId,
    generationPublicId,
    generationInputKey,
    job,
    normalizedActiveStep,
    processSettings.doVerdict,
    promptCacheContext,
    refreshTokenUsed,
    resume,
    setResumeResult,
    setTokenUsed,
    t,
    toast,
    verdictInputKey,
  ]);

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
    if (evaluatingRef.current) return;
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

      const currentInputKey = buildGenerationInputKey(
        job,
        processSettings.doVerdict,
        combine,
        fingerprintRes.data.fingerprint,
        promptCacheContext,
      );
      if (currentInputKey !== generationInputKey) {
        toast(t("toast.combineContentChanged"), "error");
        return;
      }

      const nextEvaluationInputKey = buildEvaluationInputKey(
        job,
        processSettings.doVerdict,
        combine,
        fingerprintRes.data.fingerprint,
        promptCacheContext,
        resume,
      );
      if (
        canReuseStoredEvaluation(
          sessionSnapshot,
          nextEvaluationInputKey,
        )
      ) {
        return;
      }

      const jobContext = buildResumeJobContext(job, processSettings.doVerdict);
      const autoRunKey = `generate:evaluate:${nextEvaluationInputKey}`;
      if (!claimAutoRun(autoRunKey)) {
        return;
      }

      try {
        const res = await runAiEvaluate({
          jobContext,
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
    evaluationInputKey,
    evaluationMarkdown,
    generationId,
    generationPublicId,
    generationInputKey,
    job,
    normalizedActiveStep,
    processSettings.doVerdict,
    promptCacheContext,
    refreshTokenUsed,
    resume,
    setEvaluationResult,
    setTokenUsed,
    t,
    toast,
    verdictInputKey,
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
      jdCompanyName: job.jdCompanyName,
      jdJobRole: job.jdJobRole,
    }),
    [generationPublicId, job.jdCompanyName, job.jdJobRole],
  );

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
    if (processBusy || resetting) return;
    if (needsNewGenerationConfirm(normalizedActiveStep, visibleSteps)) {
      setNewConfirmOpen(true);
      return;
    }
    void runNewGeneration();
  }, [
    normalizedActiveStep,
    processBusy,
    resetting,
    runNewGeneration,
    visibleSteps,
  ]);

  function confirmNewGeneration() {
    void runNewGeneration();
  }

  function confirmRunWithStaleDownstream() {
    const action = pendingRunRef.current;
    pendingRunRef.current = null;
    setRunConfirmOpen(false);
    action?.();
  }

  const { previousTitle, previousContent, previousHeaderRight } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps,
      doVerdict: processSettings.doVerdict,
      job,
      combine,
      resume,
    });

  if (loading || !sessionReady) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("generate.loading")}
      </main>
    );
  }

  if (missing) {
    return <GeneratePrerequisites missing={missing} />;
  }

  return (
    <GenerateStepNavProvider>
      <section className="-m-6 flex h-[calc(100dvh-3.5rem)] w-auto flex-col overflow-hidden">
        <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 items-start gap-3">
              <GenerateNewButton
                onClick={requestNewGeneration}
                disabled={processBusy || resetting}
              />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t("generate.title")}
                </h1>
                {generationPublicId ? (
                  <p className="font-mono text-sm text-muted">
                    {generationPublicId}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_3.5rem] items-center gap-3">
              <GenerateTimeline
                active={normalizedActiveStep}
                steps={visibleSteps}
                onStepSelect={setActiveStep}
              />
              <GenerateStepNavRunButton />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 pt-6 pb-6">
          <GenerateStepLayout
            previousTitle={previousTitle}
            previous={previousContent}
            previousHeaderRight={previousHeaderRight}
            currentTitle={getGenerateCurrentPanelTitle(normalizedActiveStep, t)}
            currentFooter={
              normalizedActiveStep === "Combine" ? combineFooter : undefined
            }
            currentHeaderRight={
              normalizedActiveStep === "Job" ? (
                <button
                  type="button"
                  onClick={() => void onResetJob()}
                  disabled={jobIsEmpty || processBusy}
                  aria-label={t("generate.job.resetAria")}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40"
                >
                  {resettingJob
                    ? t("generate.job.resetting")
                    : t("generate.job.reset")}
                </button>
              ) : normalizedActiveStep === "Combine" ? (
                <CombineTotalTenureHeader combine={combine} />
              ) : normalizedActiveStep === "Generate" && resume ? (
                generateHeaderRight
              ) : undefined
            }
            swapColumns={normalizedActiveStep === "Job"}
            currentFill={
              normalizedActiveStep === "Job" ||
              (normalizedActiveStep === "Generate" && Boolean(resume))
            }
          >
            {normalizedActiveStep === "Job" ? (
              <GenerateJobStep
                job={job}
                onJobChange={setJob}
                onRunFromJob={runFromJob}
              />
            ) : null}
            {processSettings.doVerdict && normalizedActiveStep === "Verdict" ? (
              <GenerateVerdictStep
                job={job}
                onJobChange={setJob}
                running={verdictRunning}
                onRun={runFromVerdict}
              />
            ) : null}
            {normalizedActiveStep === "Combine" ? (
              <GenerateCombineStep
                combine={combine}
                onCombineChange={setCombine}
                job={job}
                onJobChange={setJob}
                doVerdict={processSettings.doVerdict}
                generationId={generationId}
                onSaveBeforeSuggest={onSaveBeforeSuggest}
                onRunFromCombine={runFromCombine}
                onFooterChange={setCombineFooter}
              />
            ) : null}
            {normalizedActiveStep === "Generate" ? (
              <GenerateGenerateStep
                resume={resume}
                aiResumeSnapshot={resumeAiSnapshot}
                downloadLabel={downloadLabel}
                doEvaluate={processSettings.doEvaluate}
                generating={generatingResume}
                onRun={runFromGenerate}
                onResumeChange={updateResume}
                onHeaderRightChange={setGenerateHeaderRight}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
            {processSettings.doEvaluate &&
            normalizedActiveStep === "Evaluate" ? (
              <GenerateEvaluateStep
                generationId={generationId}
                resume={resume}
                downloadLabel={downloadLabel}
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
          onConfirm={() => void confirmNewGeneration()}
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
          closeDisabled={processBusy}
          confirmDisabled={processBusy}
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

      {jobDuplicateChecking ? (
        <BusyOverlay
          title={t("generate.jobDuplicate.checking.title")}
          description={t("generate.jobDuplicate.checking.description")}
        />
      ) : null}

      {jdMetaRunning ? (
        <BusyOverlay
          title={t("generate.job.runningJdMeta.title")}
          description={t("generate.job.runningJdMeta.description")}
        />
      ) : null}

      {jobDuplicateDialogOpen && jobDuplicateMatch ? (
        <GenerateJobDuplicateDialog
          open
          newFilteredJobText={jobDuplicateNewFilteredJobText}
          match={jobDuplicateMatch}
          busy={jobDuplicateDialogBusy}
          onClose={closeJobDuplicateDialog}
          onCancel={() => void handleJobDuplicateCancel()}
          onContinue={() => void handleJobDuplicateContinue()}
          onSwitch={
            jobDuplicateMatch.finalized
              ? undefined
              : () => void handleJobDuplicateSwitch()
          }
        />
      ) : null}
    </GenerateStepNavProvider>
  );
}
