"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AddButton } from "@/components/shared/action-icon-buttons";
import { GenerateGenerateStep } from "@/components/generate/GenerateGenerateStep";
import { GenerateEvaluateStep } from "@/components/generate/GenerateEvaluateStep";
import {
  GeneratePrerequisites,
  type MissingPrerequisite,
} from "@/components/generate/GeneratePrerequisites";
import { GenerateTimeline } from "@/components/generate/GenerateTimeline";
import { GenerateJobStep } from "@/components/generate/GenerateJobStep";
import { GenerateWorkflowStep } from "@/components/generate/GenerateWorkflowStep";
import {
  GenerateStepNavNextButton,
  GenerateStepNavPrevButton,
  GenerateStepNavProvider,
} from "@/components/generate/GenerateStepNav";
import { useGenerateSession } from "@/components/generate/useGenerateSession";
import { EMPTY_WORKFLOW_SELECTION } from "@/components/generate/pcew-types";
import { validateWorkflowSelection } from "@/components/generate/pcew-types";
import {
  buildEvaluationInputKey,
  buildGenerationInputKey,
  buildResumeJobContext,
  buildWorkflowListFingerprint,
  buildWorkflowRecommendInputKey,
  canReuseStoredEvaluation,
  canReuseStoredResume,
  canReuseStoredWorkflowRecommend,
} from "@/lib/generate-session";
import {
  getAdjacentGenerateStep,
  getGenerateSteps,
  normalizeGenerateActiveStep,
} from "@/lib/generate-steps";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  getGenerationProcess,
  getPrompts,
  getWorkflowGenerationFingerprint,
  listWorkflows,
  runAiEvaluate,
  runAiResume,
  runAiWorkflowRecommend,
  type Workflow,
} from "@/lib/api";

const DEFAULT_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
  doWorkflowRecommendation: false,
  workflowRecommendationThreshold: 70,
  lastSelectedWorkflowId: null as string | null,
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
  const [recommending, setRecommending] = useState(false);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [processSettings, setProcessSettings] = useState(DEFAULT_PROCESS);
  const [promptSettings, setPromptSettings] = useState(DEFAULT_PROMPTS);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    job,
    setJob,
    workflow,
    setWorkflow,
    oneTimePrompt,
    setOneTimePrompt,
    verdictInputKey,
    workflowRecommendInputKey,
    setVerdictResult,
    setWorkflowRecommendResult,
    resume,
    generationInputKey,
    setResumeResult,
    evaluationMarkdown,
    evaluationInputKey,
    setEvaluationResult,
    resetSession,
  } = useGenerateSession();

  const processBusy =
    verdictRunning || recommending || generatingResume || evaluating;

  const visibleSteps = useMemo(
    () => getGenerateSteps(processSettings.doEvaluate),
    [processSettings.doEvaluate],
  );

  const normalizedActiveStep = useMemo(
    () => normalizeGenerateActiveStep(activeStep, processSettings.doEvaluate),
    [activeStep, processSettings.doEvaluate],
  );

  const workflowsFingerprint = useMemo(
    () => buildWorkflowListFingerprint(workflows),
    [workflows],
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
      listWorkflows("", null),
      getPrompts(),
      getGenerationProcess(),
    ]).then(([workflowsRes, prompts, process]) => {
      if (cancelled) return;
      const errors = [workflowsRes.error, prompts.error, process.error].filter(
        Boolean,
      );
      if (errors.length > 0) {
        toast(errors[0] ?? t("toast.prerequisitesCheckFailed"), "error");
        setLoading(false);
        setMissing([
          {
            label: t("generate.prerequisites.labels.workflows"),
            href: "/workflows",
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
        doWorkflowRecommendation:
          process.data?.doWorkflowRecommendation ??
          DEFAULT_PROCESS.doWorkflowRecommendation,
        workflowRecommendationThreshold:
          process.data?.workflowRecommendationThreshold ??
          DEFAULT_PROCESS.workflowRecommendationThreshold,
        lastSelectedWorkflowId:
          process.data?.lastSelectedWorkflowId ??
          DEFAULT_PROCESS.lastSelectedWorkflowId,
      };
      setProcessSettings(nextProcess);
      setWorkflows(workflowsRes.data?.items ?? []);
      setPromptSettings({
        verdictPrompt: prompts.data?.verdictPrompt ?? "",
        generatePrompt: prompts.data?.generatePrompt ?? "",
        evaluatePrompt: prompts.data?.evaluatePrompt ?? "",
      });

      const nextMissing: MissingPrerequisite[] = [];
      if ((workflowsRes.data?.total ?? 0) < 1) {
        nextMissing.push({
          label: t("generate.prerequisites.labels.workflows"),
          href: "/workflows",
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

  function goToStep(step: typeof activeStep) {
    setActiveStep(step);
  }

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

  const onAdvanceToWorkflow = useCallback(async () => {
    if (recommending) return;

    if (!processSettings.doWorkflowRecommendation) {
      const lastId = processSettings.lastSelectedWorkflowId;
      if (lastId) {
        const match = workflows.find((item) => item.id === lastId);
        if (match) {
          setWorkflow({ workflowId: match.id, workflowName: match.name });
        } else {
          setWorkflow({ ...EMPTY_WORKFLOW_SELECTION });
        }
      } else {
        setWorkflow({ ...EMPTY_WORKFLOW_SELECTION });
      }
      goToStep("Workflow");
      return;
    }

    const recommendInputKey = buildWorkflowRecommendInputKey({
      job,
      threshold: processSettings.workflowRecommendationThreshold,
      workflowsFingerprint,
    });

    if (canReuseStoredWorkflowRecommend({ workflowRecommendInputKey }, recommendInputKey)) {
      goToStep("Workflow");
      return;
    }

    const jobDescription = noiseFilter(job.jobText.trim()).text;
    const acceptedMarkdown = job.acceptedMarkdown?.trim() || undefined;

    setRecommending(true);
    try {
      const res = await runAiWorkflowRecommend({
        jobDescription,
        acceptedMarkdown,
      });
      if (!res.data) {
        toast(res.error ?? t("toast.workflowRecommendFailed"), "error");
        return;
      }

      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();

      if (res.data.workflowId && res.data.workflowName) {
        setWorkflowRecommendResult(
          {
            workflowId: res.data.workflowId,
            workflowName: res.data.workflowName,
          },
          recommendInputKey,
        );
        toast(
          t("toast.workflowRecommended", {
            workflowName: res.data.workflowName,
            score: res.data.score ?? "",
          }),
          "success",
        );
      } else {
        setWorkflowRecommendResult(
          { ...EMPTY_WORKFLOW_SELECTION },
          recommendInputKey,
        );
        const bestScoreSuffix =
          res.data.score != null
            ? t("toast.workflowBestScoreSuffix", { score: res.data.score })
            : "";
        toast(
          t("toast.workflowThresholdNotMet", { bestScoreSuffix }),
          "warning",
        );
      }

      goToStep("Workflow");
    } catch {
      toast(t("toast.workflowRecommendFailed"), "error");
    } finally {
      setRecommending(false);
    }
  }, [
    job,
    recommending,
    processSettings.doWorkflowRecommendation,
    processSettings.lastSelectedWorkflowId,
    processSettings.workflowRecommendationThreshold,
    refreshTokenUsed,
    setTokenUsed,
    setWorkflow,
    setWorkflowRecommendResult,
    t,
    toast,
    workflowRecommendInputKey,
    workflows,
    workflowsFingerprint,
  ]);

  async function onWorkflowNext() {
    if (generatingResume) return;

    const errors = validateWorkflowSelection(workflow);
    if (Object.keys(errors).length > 0) return;

    const fingerprintRes = await getWorkflowGenerationFingerprint(
      workflow.workflowId,
    );
    if (!fingerprintRes.data?.fingerprint) {
      toast(
        fingerprintRes.error ?? t("toast.workflowFingerprintFailed"),
        "error",
      );
      return;
    }

    const inputKey = buildGenerationInputKey(
      job,
      processSettings.doVerdict,
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
      oneTimePrompt,
    );
    if (
      canReuseStoredResume(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
          oneTimePrompt,
          verdictInputKey,
          workflowRecommendInputKey,
          resume,
          generationInputKey,
          evaluationMarkdown,
          evaluationInputKey,
        },
        inputKey,
      )
    ) {
      setActiveStep("Generate");
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
        workflowId: workflow.workflowId,
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
      setActiveStep("Generate");
    } catch {
      toast(t("toast.resumeGenerateFailed"), "error");
    } finally {
      setGeneratingResume(false);
    }
  }

  async function onGenerateNext() {
    if (evaluating) return;

    if (!resume || !generationInputKey) {
      toast(t("toast.noResumeForEvaluate"), "error");
      return;
    }

    const fingerprintRes = await getWorkflowGenerationFingerprint(
      workflow.workflowId,
    );
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
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
      oneTimePrompt,
    );
    if (currentInputKey !== generationInputKey) {
      toast(t("toast.workflowContentChanged"), "error");
      return;
    }

    const nextEvaluationInputKey = buildEvaluationInputKey(
      job,
      processSettings.doVerdict,
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
      oneTimePrompt,
    );
    if (
      canReuseStoredEvaluation(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
          oneTimePrompt,
          verdictInputKey,
          workflowRecommendInputKey,
          resume,
          generationInputKey,
          evaluationMarkdown,
          evaluationInputKey,
        },
        nextEvaluationInputKey,
      )
    ) {
      setActiveStep("Evaluate");
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
      setActiveStep("Evaluate");
    } catch {
      toast(t("toast.evaluateFailed"), "error");
    } finally {
      setEvaluating(false);
    }
  }

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
      <section className="mx-auto w-full max-w-4xl">
        <div className="sticky top-[-24] z-10 -mx-6 -mt-6 border-b border-border bg-background px-6 pt-6 pb-4">
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

        <div className="pt-6">
          {normalizedActiveStep === "Job" ? (
            <GenerateJobStep
              job={job}
              verdictInputKey={verdictInputKey}
              verdictPrompt={promptSettings.verdictPrompt}
              doVerdict={processSettings.doVerdict}
              onJobChange={setJob}
              onVerdictResult={setVerdictResult}
              onAdvanceToWorkflow={onAdvanceToWorkflow}
              onRunningChange={setVerdictRunning}
            />
          ) : null}
          {normalizedActiveStep === "Workflow" ? (
            <GenerateWorkflowStep
              doVerdict={processSettings.doVerdict}
              acceptedMarkdown={
                processSettings.doVerdict ? job.acceptedMarkdown : null
              }
              selection={workflow}
              oneTimePrompt={oneTimePrompt}
              generating={generatingResume}
              onSelectionChange={setWorkflow}
              onOneTimePromptChange={setOneTimePrompt}
              onPrev={() => goToAdjacentStep("prev")}
              onNext={onWorkflowNext}
            />
          ) : null}
          {normalizedActiveStep === "Generate" ? (
            <GenerateGenerateStep
              resume={resume}
              workflowName={workflow.workflowName}
              doEvaluate={processSettings.doEvaluate}
              evaluating={evaluating}
              onPrev={() => goToAdjacentStep("prev")}
              onNext={onGenerateNext}
            />
          ) : null}
          {processSettings.doEvaluate && normalizedActiveStep === "Evaluate" ? (
            <GenerateEvaluateStep
              resume={resume}
              workflowName={workflow.workflowName}
              evaluationMarkdown={evaluationMarkdown}
              onPrev={() => goToAdjacentStep("prev")}
            />
          ) : null}
        </div>
      </section>

      {recommending ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.recommending.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.recommending.description")}
            </p>
          </div>
        </div>
      ) : null}
    </GenerateStepNavProvider>
  );
}
