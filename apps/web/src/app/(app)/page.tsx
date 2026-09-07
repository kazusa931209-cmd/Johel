"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
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
        toast(errors[0] ?? "Failed to check Generate prerequisites", "error");
        setLoading(false);
        setMissing([
          { label: "Workflows", href: "/workflows" },
          { label: "Prompts", href: "/prompts" },
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
        nextMissing.push({ label: "Workflows", href: "/workflows" });
      }
      if (nextProcess.doVerdict && !prompts.data?.verdictPrompt.trim()) {
        nextMissing.push({ label: "Verdict Prompt", href: "/prompts" });
      }
      if (!prompts.data?.generatePrompt.trim()) {
        nextMissing.push({ label: "Generate Prompt", href: "/prompts" });
      }
      if (nextProcess.doEvaluate && !prompts.data?.evaluatePrompt.trim()) {
        nextMissing.push({ label: "Evaluate Prompt", href: "/prompts" });
      }

      setMissing(nextMissing.length > 0 ? nextMissing : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

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
        toast(res.error ?? "AI Workflow recommendation failed.", "error");
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
          `Recommended workflow: ${res.data.workflowName} (score ${res.data.score}).`,
          "success",
        );
      } else {
        setWorkflowRecommendResult(
          { ...EMPTY_WORKFLOW_SELECTION },
          recommendInputKey,
        );
        const scoreText =
          res.data.score != null ? ` (best score ${res.data.score})` : "";
        toast(
          `No workflow met the recommendation threshold${scoreText}.`,
          "warning",
        );
      }

      goToStep("Workflow");
    } catch {
      toast("AI Workflow recommendation failed.", "error");
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
        fingerprintRes.error ??
          "Failed to load workflow content for resume generation.",
        "error",
      );
      return;
    }

    const inputKey = buildGenerationInputKey(
      job,
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
    );
    if (
      canReuseStoredResume(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
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

    const acceptedMarkdown = processSettings.doVerdict
      ? job.acceptedMarkdown?.trim()
      : "";
    if (processSettings.doVerdict && !acceptedMarkdown) {
      toast(
        "AI Verdict result is missing. Go back to Job and run analysis first.",
        "error",
      );
      return;
    }

    const jobDescription = noiseFilter(job.jobText.trim()).text;
    setGeneratingResume(true);
    try {
      const res = await runAiResume({
        jobDescription,
        acceptedMarkdown: acceptedMarkdown ?? "",
        workflowId: workflow.workflowId,
      });
      if (!res.data) {
        toast(res.error ?? "AI Resume generation failed.", "error");
        return;
      }

      setResumeResult(res.data.resume, inputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast("Resume generated.", "success");
      setActiveStep("Generate");
    } catch {
      toast("AI Resume generation failed.", "error");
    } finally {
      setGeneratingResume(false);
    }
  }

  async function onGenerateNext() {
    if (evaluating) return;

    if (!resume || !generationInputKey) {
      toast(
        "No generated resume is available. Go back to Workflow and run generation first.",
        "error",
      );
      return;
    }

    const fingerprintRes = await getWorkflowGenerationFingerprint(
      workflow.workflowId,
    );
    if (!fingerprintRes.data?.fingerprint) {
      toast(
        fingerprintRes.error ??
          "Failed to load workflow content for evaluation.",
        "error",
      );
      return;
    }

    const currentInputKey = buildGenerationInputKey(
      job,
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
    );
    if (currentInputKey !== generationInputKey) {
      toast(
        "Workflow content changed. Go back to Workflow to regenerate your resume.",
        "error",
      );
      return;
    }

    const nextEvaluationInputKey = buildEvaluationInputKey(
      job,
      workflow,
      fingerprintRes.data.fingerprint,
      promptCacheContext,
    );
    if (
      canReuseStoredEvaluation(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
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

    const jobDescription = noiseFilter(job.jobText.trim()).text;
    setEvaluating(true);
    try {
      const res = await runAiEvaluate({ jobDescription, resume });
      if (!res.data) {
        toast(res.error ?? "AI Evaluate failed.", "error");
        return;
      }

      setEvaluationResult(res.data.markdown, nextEvaluationInputKey);
      setTokenUsed(res.data.tokenUsed);
      await refreshTokenUsed();
      toast("Resume evaluated.", "success");
      setActiveStep("Evaluate");
    } catch {
      toast("AI Evaluate failed.", "error");
    } finally {
      setEvaluating(false);
    }
  }

  if (loading || !sessionReady) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
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
                  Generate
                </h1>
                <AddButton
                  showLabel
                  label="New"
                  onClick={resetSession}
                  disabled={processBusy}
                />
              </div>
              <p className="text-sm text-muted">
                Prepare the Job Description, then choose a workflow preset.
              </p>
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
              acceptedMarkdown={
                processSettings.doVerdict ? job.acceptedMarkdown : null
              }
              selection={workflow}
              generating={generatingResume}
              onSelectionChange={setWorkflow}
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
            <p className="text-sm font-medium">Recommending workflow…</p>
            <p className="mt-1 text-xs text-muted">
              Please wait while the AI matches your job to a workflow.
            </p>
          </div>
        </div>
      ) : null}
    </GenerateStepNavProvider>
  );
}
