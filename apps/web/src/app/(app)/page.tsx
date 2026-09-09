"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AddButton } from "@/components/shared/action-icon-buttons";
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
  GenerateStepNavNextButton,
  GenerateStepNavPrevButton,
  GenerateStepNavProvider,
} from "@/components/generate/GenerateStepNav";
import { useGenerateSession } from "@/components/generate/useGenerateSession";
import { validateCombineSnapshot } from "@/components/generate/combine-types";
import {
  buildEvaluationInputKey,
  buildGenerationInputKey,
  buildResumeJobContext,
  canReuseStoredEvaluation,
  canReuseStoredResume,
} from "@/lib/generate-session";
import {
  getAdjacentGenerateStep,
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "@/lib/generate-steps";
import {
  getCombineGenerationFingerprint,
  getGenerationProcess,
  getPrompts,
  listCompanies,
  listExperiences,
  listProfiles,
  runAiEvaluate,
  runAiResume,
} from "@/lib/api";

const DEFAULT_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
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
  const [verdictRunning, setVerdictRunning] = useState(false);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [processSettings, setProcessSettings] = useState(DEFAULT_PROCESS);
  const [promptSettings, setPromptSettings] = useState(DEFAULT_PROMPTS);
  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    job,
    setJob,
    combine,
    setCombine,
    oneTimePrompt,
    setOneTimePrompt,
    verdictInputKey,
    setVerdictResult,
    resume,
    generationInputKey,
    setResumeResult,
    evaluationMarkdown,
    evaluationInputKey,
    setEvaluationResult,
    resetSession,
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

  function goToAdjacentStep(direction: "prev" | "next") {
    const next = getAdjacentGenerateStep(
      visibleSteps,
      normalizedActiveStep,
      direction,
    );
    if (next) {
      setActiveStep(next);
    }
  }

  const promptCacheContext = useMemo(
    () => ({
      verdictPrompt: promptSettings.verdictPrompt,
      generatePrompt: promptSettings.generatePrompt,
      evaluatePrompt: promptSettings.evaluatePrompt,
    }),
    [promptSettings],
  );

  const onAdvanceFromJob = useCallback(() => {
    if (processSettings.doVerdict) {
      setActiveStep("Verdict");
      return;
    }
    setJob({ ...job, acceptedMarkdown: null });
    setActiveStep("Combine");
  }, [job, processSettings.doVerdict, setActiveStep, setJob]);

  function onCombineNext() {
    const errors = validateCombineSnapshot(combine, t);
    if (Object.keys(errors).length > 0) return;
    setActiveStep("Generate");
  }

  const runResumeGeneration = useCallback(async () => {
    if (generatingResume) return;

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
      oneTimePrompt,
    );
    if (
      canReuseStoredResume(
        {
          activeStep: normalizedActiveStep,
          job,
          combine,
          oneTimePrompt,
          verdictInputKey,
          resume,
          generationInputKey,
          evaluationMarkdown,
          evaluationInputKey,
        },
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

    setGeneratingResume(true);
    try {
      const trimmedOneTimePrompt = oneTimePrompt.trim();
      const res = await runAiResume({
        jobContext,
        combine,
        ...(trimmedOneTimePrompt
          ? { oneTimePrompt: trimmedOneTimePrompt }
          : {}),
      });
      if (!res.data) {
        toast(res.error ?? t("toast.resumeGenerateFailed"), "error");
        return;
      }

      setResumeResult(res.data.resume, inputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.resumeGenerated"), "success");
    } catch {
      toast(t("toast.resumeGenerateFailed"), "error");
    } finally {
      setGeneratingResume(false);
    }
  }, [
    combine,
    evaluationInputKey,
    evaluationMarkdown,
    generatingResume,
    generationInputKey,
    job,
    normalizedActiveStep,
    oneTimePrompt,
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

  function onGenerateNext() {
    if (!resume) {
      toast(t("toast.noResumeForEvaluate"), "error");
      return;
    }
    setActiveStep("Evaluate");
  }

  const runEvaluation = useCallback(async () => {
    if (evaluating) return;

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
      oneTimePrompt,
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
      oneTimePrompt,
    );
    if (
      canReuseStoredEvaluation(
        {
          activeStep: normalizedActiveStep,
          job,
          combine,
          oneTimePrompt,
          verdictInputKey,
          resume,
          generationInputKey,
          evaluationMarkdown,
          evaluationInputKey,
        },
        nextEvaluationInputKey,
      )
    ) {
      return;
    }

    const jobContext = buildResumeJobContext(job, processSettings.doVerdict);
    setEvaluating(true);
    try {
      const res = await runAiEvaluate({ jobContext, resume });
      if (!res.data) {
        toast(res.error ?? t("toast.evaluateFailed"), "error");
        return;
      }

      setEvaluationResult(res.data.markdown, nextEvaluationInputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast(t("toast.resumeEvaluated"), "success");
    } catch {
      toast(t("toast.evaluateFailed"), "error");
    } finally {
      setEvaluating(false);
    }
  }, [
    combine,
    evaluating,
    evaluationInputKey,
    evaluationMarkdown,
    generationInputKey,
    job,
    normalizedActiveStep,
    oneTimePrompt,
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

  const runLabel = combine.emphasis.trim() || combine.language;

  const { previousTitle, previousContent } = useGeneratePreviousStepPanel({
    currentStep: normalizedActiveStep,
    visibleSteps,
    job,
    combine,
    oneTimePrompt,
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
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t("generate.title")}
                </h1>
                <AddButton
                  showLabel
                  label={t("generate.new")}
                  onClick={resetSession}
                  disabled={processBusy}
                />
              </div>
              <p className="text-sm text-muted">{t("generate.description")}</p>
            </div>
            <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-3">
              <GenerateStepNavPrevButton />
              <GenerateTimeline
                active={normalizedActiveStep}
                steps={visibleSteps}
              />
              <GenerateStepNavNextButton />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 pt-6 pb-6">
          <GenerateStepLayout
            previousTitle={previousTitle}
            previous={previousContent}
          >
            {normalizedActiveStep === "Job" ? (
              <GenerateJobStep
                job={job}
                onJobChange={setJob}
                onAdvanceFromJob={onAdvanceFromJob}
              />
            ) : null}
            {processSettings.doVerdict && normalizedActiveStep === "Verdict" ? (
              <GenerateVerdictStep
                job={job}
                verdictInputKey={verdictInputKey}
                verdictPrompt={promptSettings.verdictPrompt}
                onVerdictResult={setVerdictResult}
                onPrev={() => goToAdjacentStep("prev")}
                onNext={() => setActiveStep("Combine")}
                running={verdictRunning}
                onRunningChange={setVerdictRunning}
              />
            ) : null}
            {normalizedActiveStep === "Combine" ? (
              <GenerateCombineStep
                combine={combine}
                oneTimePrompt={oneTimePrompt}
                jobText={job.jobText}
                acceptedMarkdown={job.acceptedMarkdown}
                doVerdict={processSettings.doVerdict}
                onCombineChange={setCombine}
                onOneTimePromptChange={setOneTimePrompt}
                onPrev={() => goToAdjacentStep("prev")}
                onNext={onCombineNext}
              />
            ) : null}
            {normalizedActiveStep === "Generate" ? (
              <GenerateGenerateStep
                resume={resume}
                runLabel={runLabel}
                doEvaluate={processSettings.doEvaluate}
                generating={generatingResume}
                onAutoGenerate={runResumeGeneration}
                onPrev={() => goToAdjacentStep("prev")}
                onNext={onGenerateNext}
              />
            ) : null}
            {processSettings.doEvaluate &&
            normalizedActiveStep === "Evaluate" ? (
              <GenerateEvaluateStep
                resume={resume}
                runLabel={runLabel}
                evaluationMarkdown={evaluationMarkdown}
                evaluating={evaluating}
                onAutoEvaluate={runEvaluation}
                onPrev={() => goToAdjacentStep("prev")}
              />
            ) : null}
          </GenerateStepLayout>
        </div>
      </section>
    </GenerateStepNavProvider>
  );
}
