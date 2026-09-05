"use client";

import { useEffect, useMemo, useState } from "react";
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
import { validateWorkflowSelection } from "@/components/generate/pcew-types";
import {
  buildGenerationInputKey,
  canReuseStoredEvaluation,
  canReuseStoredResume,
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
  listWorkflows,
  runAiEvaluate,
  runAiResume,
} from "@/lib/api";

const DEFAULT_PROCESS = {
  doVerdict: true,
  doEvaluate: true,
};

export default function GeneratePage() {
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [loading, setLoading] = useState(true);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [verdictRunning, setVerdictRunning] = useState(false);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [processSettings, setProcessSettings] = useState(DEFAULT_PROCESS);
  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    job,
    setJob,
    workflow,
    setWorkflow,
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

  const processBusy = verdictRunning || generatingResume || evaluating;

  const visibleSteps = useMemo(
    () => getGenerateSteps(processSettings.doEvaluate),
    [processSettings.doEvaluate],
  );

  const normalizedActiveStep = useMemo(
    () => normalizeGenerateActiveStep(activeStep, processSettings.doEvaluate),
    [activeStep, processSettings.doEvaluate],
  );

  useEffect(() => {
    if (!sessionReady) return;
    if (normalizedActiveStep !== activeStep) {
      setActiveStep(normalizedActiveStep);
    }
  }, [activeStep, normalizedActiveStep, sessionReady, setActiveStep]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listWorkflows("", 1), getPrompts(), getGenerationProcess()]).then(
      ([workflows, prompts, process]) => {
        if (cancelled) return;
        const errors = [workflows.error, prompts.error, process.error].filter(
          Boolean,
        );
        if (errors.length > 0) {
          toast(
            errors[0] ?? "Failed to check Generate prerequisites",
            "error",
          );
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
        };
        setProcessSettings(nextProcess);

        const nextMissing: MissingPrerequisite[] = [];
        if ((workflows.data?.total ?? 0) < 1) {
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
      },
    );
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

  async function onWorkflowNext() {
    if (generatingResume) return;

    const errors = validateWorkflowSelection(workflow);
    if (Object.keys(errors).length > 0) return;

    const inputKey = buildGenerationInputKey(job, workflow);
    if (
      canReuseStoredResume(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
          verdictInputKey,
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

    const inputKey = generationInputKey;
    if (
      canReuseStoredEvaluation(
        {
          activeStep: normalizedActiveStep,
          job,
          workflow,
          verdictInputKey,
          resume,
          generationInputKey,
          evaluationMarkdown,
          evaluationInputKey,
        },
        inputKey,
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

      setEvaluationResult(res.data.markdown, inputKey);
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
              doVerdict={processSettings.doVerdict}
              onJobChange={setJob}
              onVerdictResult={setVerdictResult}
              onAdvanceToWorkflow={() => goToStep("Workflow")}
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
    </GenerateStepNavProvider>
  );
}
