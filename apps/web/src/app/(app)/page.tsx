"use client";

import { useEffect, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { GenerateGenerateStep } from "@/components/generate/GenerateGenerateStep";
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
  canReuseStoredResume,
} from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { getPrompts, listWorkflows, runAiResume } from "@/lib/api";

export default function GeneratePage() {
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [loading, setLoading] = useState(true);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const {
    ready: sessionReady,
    activeStep,
    setActiveStep,
    job,
    setJob,
    workflow,
    setWorkflow,
    resume,
    generationInputKey,
    setResumeResult,
  } = useGenerateSession();

  useEffect(() => {
    let cancelled = false;
    Promise.all([listWorkflows("", 1), getPrompts()]).then(
      ([workflows, prompts]) => {
        if (cancelled) return;
        const errors = [workflows.error, prompts.error].filter(Boolean);
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

        const nextMissing: MissingPrerequisite[] = [];
        if ((workflows.data?.total ?? 0) < 1) {
          nextMissing.push({ label: "Workflows", href: "/workflows" });
        }
        if (!prompts.data?.verdictPrompt.trim()) {
          nextMissing.push({ label: "Verdict Prompt", href: "/prompts" });
        }
        if (!prompts.data?.generatePrompt.trim()) {
          nextMissing.push({ label: "Generate Prompt", href: "/prompts" });
        }

        setMissing(nextMissing.length > 0 ? nextMissing : null);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function onWorkflowNext() {
    if (generatingResume) return;

    const errors = validateWorkflowSelection(workflow);
    if (Object.keys(errors).length > 0) return;

    const inputKey = buildGenerationInputKey(job, workflow);
    if (
      canReuseStoredResume(
        { activeStep, job, workflow, resume, generationInputKey },
        inputKey,
      )
    ) {
      setActiveStep("Generate");
      return;
    }

    const acceptedMarkdown = job.acceptedMarkdown?.trim();
    if (!acceptedMarkdown) {
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
        acceptedMarkdown,
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
              <h1 className="text-2xl font-semibold tracking-tight">
                Generate
              </h1>
              <p className="text-sm text-muted">
                Prepare the Job Description, then choose a workflow preset.
              </p>
            </div>
            <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-3">
              <GenerateStepNavPrevButton />
              <GenerateTimeline active={activeStep} />
              <GenerateStepNavNextButton />
            </div>
          </div>
        </div>

        <div className="pt-6">
          {activeStep === "Job" ? (
            <GenerateJobStep
              job={job}
              onJobChange={setJob}
              onAdvanceToWorkflow={() => setActiveStep("Workflow")}
            />
          ) : null}
          {activeStep === "Workflow" ? (
            <GenerateWorkflowStep
              acceptedMarkdown={job.acceptedMarkdown}
              selection={workflow}
              generating={generatingResume}
              onSelectionChange={setWorkflow}
              onPrev={() => setActiveStep("Job")}
              onNext={onWorkflowNext}
            />
          ) : null}
          {activeStep === "Generate" ? (
            <GenerateGenerateStep
              resume={resume}
              onPrev={() => setActiveStep("Workflow")}
            />
          ) : null}
        </div>
      </section>
    </GenerateStepNavProvider>
  );
}
