"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { GenerateCombineStep } from "@/components/generate/GenerateCombineStep";
import { GenerateGenerateStep } from "@/components/generate/GenerateGenerateStep";
import { GenerateEvaluateStep } from "@/components/generate/GenerateEvaluateStep";
import {
  GeneratePrerequisites,
  type MissingPrerequisite,
} from "@/components/generate/GeneratePrerequisites";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { GenerateJobStep } from "@/components/generate/GenerateJobStep";
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
import {
  getCombineGenerationFingerprint,
  getGenerationProcess,
  getPrompts,
  listCompanies,
  listExperiences,
  listProfiles,
  runAiEvaluate,
  runAiResume,
  runAiVerdict,
  type ResumeLanguage,
} from "@/lib/api";

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
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [processSettings, setProcessSettings] = useState(DEFAULT_PROCESS);
  const [promptSettings, setPromptSettings] = useState(DEFAULT_PROMPTS);
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const pendingRunRef = useRef<(() => void) | null>(null);
  const {
    ready: sessionReady,
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
    generationInputKey,
    setResumeResult,
    evaluationMarkdown,
    evaluationInputKey,
    setEvaluationResult,
    clearDownstreamFromVerdictSession,
    clearDownstreamFromGenerateSession,
    saveSnapshot,
    resetSession,
    markFinalized,
    finalized,
  } = useGenerateSession();

  const processBusy =
    verdictRunning || generatingResume || evaluating;

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
    let cancelled = false;
    Promise.all([
      listProfiles("", null),
      listCompanies("", null),
      listExperiences("", null),
      getPrompts(),
      getGenerationProcess(),
    ]).then(([profilesRes, companiesRes, experiencesRes, prompts, process]) => {
      if (cancelled) return;
      const errors = [
        profilesRes.error,
        companiesRes.error,
        experiencesRes.error,
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

      const nextMissing: MissingPrerequisite[] = [];
      if ((profilesRes.data?.total ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.profiles"),
          href: "/profiles",
        });
      }
      if ((companiesRes.data?.total ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.companies"),
          href: "/companies",
        });
      }
      if ((experiencesRes.data?.total ?? 0) < 1) {
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
      generationInputKey,
      evaluationMarkdown,
      evaluationInputKey,
      finalized,
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
      normalizedActiveStep,
      resume,
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

  const runVerdict = useCallback(async () => {
    const filtered = noiseFilter(job.jobText.trim()).text;
    const inputKey = buildVerdictInputKey(job, promptCacheContext);
    if (canReuseStoredVerdict({ job, verdictInputKey }, inputKey)) {
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

      setVerdictResult(res.data.markdown, inputKey);
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
    setVerdictResult,
    t,
    toast,
    verdictInputKey,
  ]);

  const runFromJob = useCallback(() => {
    requestRun("Job", async () => {
      clearDownstreamFromVerdictSession();
      if (processSettings.doVerdict) {
        setActiveStep("Verdict");
        await runVerdict();
        return;
      }
      setJob({ ...job, acceptedMarkdown: null });
      setActiveStep("Combine");
    });
  }, [
    clearDownstreamFromVerdictSession,
    job,
    processSettings.doVerdict,
    requestRun,
    runVerdict,
    setActiveStep,
    setJob,
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

  const runLabel = combine.emphasis.trim() || combine.language;

  const requestNewGeneration = useCallback(() => {
    if (processBusy) return;
    if (needsNewGenerationConfirm(normalizedActiveStep, visibleSteps)) {
      setNewConfirmOpen(true);
      return;
    }
    void resetSession();
  }, [normalizedActiveStep, processBusy, resetSession, visibleSteps]);

  async function confirmNewGeneration() {
    setResetting(true);
    await resetSession();
    setResetting(false);
    setNewConfirmOpen(false);
  }

  function confirmRunWithStaleDownstream() {
    const action = pendingRunRef.current;
    pendingRunRef.current = null;
    setRunConfirmOpen(false);
    action?.();
  }

  const { previousTitle, previousContent, previousHeaderRight, previousMatchCurrent } =
    useGeneratePreviousStepPanel({
      currentStep: normalizedActiveStep,
      visibleSteps,
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
            <div className="flex shrink-0 items-center gap-3">
              <GenerateNewButton
                onClick={requestNewGeneration}
                disabled={processBusy || resetting}
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("generate.title")}
              </h1>
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
            previousMatchCurrent={previousMatchCurrent}
            swapColumns={normalizedActiveStep === "Job"}
            currentFill={normalizedActiveStep === "Job"}
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
                running={verdictRunning}
                onRun={runFromVerdict}
              />
            ) : null}
            {normalizedActiveStep === "Combine" ? (
              <GenerateCombineStep
                combine={combine}
                onCombineChange={setCombine}
                job={job}
                doVerdict={processSettings.doVerdict}
                generationId={generationId}
                onRunFromCombine={runFromCombine}
              />
            ) : null}
            {normalizedActiveStep === "Generate" ? (
              <GenerateGenerateStep
                resume={resume}
                runLabel={runLabel}
                doEvaluate={processSettings.doEvaluate}
                generating={generatingResume}
                onRun={runFromGenerate}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
            {processSettings.doEvaluate &&
            normalizedActiveStep === "Evaluate" ? (
              <GenerateEvaluateStep
                resume={resume}
                runLabel={runLabel}
                evaluationMarkdown={evaluationMarkdown}
                evaluating={evaluating}
                onDownloaded={handleResumeDownloaded}
              />
            ) : null}
          </GenerateStepLayout>
        </div>
      </section>

      {newConfirmOpen ? (
        <DetailDialog
          title={t("generate.newConfirm.title")}
          role="alertdialog"
          closeDisabled={resetting}
          onClose={() => setNewConfirmOpen(false)}
        >
          <p className="text-muted">{t("generate.newConfirm.body")}</p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={resetting}
              onClick={() => void confirmNewGeneration()}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
            >
              {resetting ? t("generate.newConfirm.confirming") : t("generate.new")}
            </button>
          </div>
        </DetailDialog>
      ) : null}

      {runConfirmOpen ? (
        <DetailDialog
          title={t("generate.runConfirm.title")}
          role="alertdialog"
          closeDisabled={processBusy}
          onClose={() => {
            pendingRunRef.current = null;
            setRunConfirmOpen(false);
          }}
        >
          <p className="text-muted">{t("generate.runConfirm.body")}</p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={processBusy}
              onClick={confirmRunWithStaleDownstream}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
            >
              {t("generate.runConfirm.confirm")}
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </GenerateStepNavProvider>
  );
}
