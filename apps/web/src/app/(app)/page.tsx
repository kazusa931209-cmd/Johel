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
import { GeneratePcewStep } from "@/components/generate/GeneratePcewStep";
import { useGenerateSession } from "@/components/generate/useGenerateSession";
import { validatePcewSelection } from "@/components/generate/pcew-types";
import {
  buildGenerationInputKey,
  canReuseStoredResume,
} from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  getVerdict,
  listCompanies,
  listExperiences,
  listProfiles,
  listWorkflows,
  runAiResume,
} from "@/lib/api";

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
    pcew,
    setPcew,
    resume,
    generationInputKey,
    setResumeResult,
  } = useGenerateSession();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listProfiles("", 1),
      listCompanies("", 1),
      listExperiences("", 1),
      listWorkflows("", 1),
      getVerdict(),
    ]).then(([profiles, companies, experiences, workflows, verdict]) => {
      if (cancelled) return;
      const errors = [
        profiles.error,
        companies.error,
        experiences.error,
        workflows.error,
        verdict.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        toast(errors[0] ?? "Failed to check Generate prerequisites", "error");
        setLoading(false);
        setMissing([
          { label: "Profiles", href: "/profiles" },
          { label: "Companies", href: "/companies" },
          { label: "Experiences", href: "/experiences" },
          { label: "Workflows", href: "/workflows" },
          { label: "Verdict", href: "/verdict" },
        ]);
        return;
      }

      const nextMissing: MissingPrerequisite[] = [];
      if ((profiles.data?.total ?? 0) < 1) {
        nextMissing.push({ label: "Profiles", href: "/profiles" });
      }
      if ((companies.data?.total ?? 0) < 1) {
        nextMissing.push({ label: "Companies", href: "/companies" });
      }
      if ((experiences.data?.total ?? 0) < 1) {
        nextMissing.push({ label: "Experiences", href: "/experiences" });
      }
      if ((workflows.data?.total ?? 0) < 1) {
        nextMissing.push({ label: "Workflows", href: "/workflows" });
      }
      if (!verdict.data?.verdictPrompt.trim()) {
        nextMissing.push({ label: "Verdict", href: "/verdict" });
      }

      setMissing(nextMissing.length > 0 ? nextMissing : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function onPcewNext() {
    if (generatingResume) return;

    const errors = validatePcewSelection(pcew);
    if (Object.keys(errors).length > 0) return;

    const inputKey = buildGenerationInputKey(job, pcew);
    if (
      canReuseStoredResume(
        { activeStep, job, pcew, resume, generationInputKey },
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
        profileId: pcew.profileId,
        companyIds: pcew.companyIds,
        experienceIds: pcew.experienceIds,
        workflowId: pcew.workflowId,
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
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted">
          Prepare the Job Description, then choose Profile, Companies,
          Experiences, and Workflow.
        </p>
      </div>
      <GenerateTimeline active={activeStep} />
      {activeStep === "Job" ? (
        <GenerateJobStep
          job={job}
          onJobChange={setJob}
          onAdvanceToPcew={() => setActiveStep("PCEW")}
        />
      ) : null}
      {activeStep === "PCEW" ? (
        <GeneratePcewStep
          acceptedMarkdown={job.acceptedMarkdown}
          selection={pcew}
          generating={generatingResume}
          onSelectionChange={setPcew}
          onPrev={() => setActiveStep("Job")}
          onNext={onPcewNext}
        />
      ) : null}
      {activeStep === "Generate" ? (
        <GenerateGenerateStep
          resume={resume}
          onPrev={() => setActiveStep("PCEW")}
        />
      ) : null}
    </section>
  );
}
