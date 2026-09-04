"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import {
  GeneratePrerequisites,
  type MissingPrerequisite,
} from "@/components/generate/GeneratePrerequisites";
import { GenerateTimeline, type GenerateStep } from "@/components/generate/GenerateTimeline";
import { GenerateJobStep } from "@/components/generate/GenerateJobStep";
import { GeneratePcewStep } from "@/components/generate/GeneratePcewStep";
import {
  EMPTY_PCEW_SELECTION,
  type PcewSelection,
} from "@/components/generate/pcew-types";
import {
  listCompanies,
  listExperiences,
  listProfiles,
  listWorkflows,
} from "@/lib/api";

export default function GeneratePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState<MissingPrerequisite[] | null>(null);
  const [activeStep, setActiveStep] = useState<GenerateStep>("Job");
  const [pcew, setPcew] = useState<PcewSelection>(EMPTY_PCEW_SELECTION);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listProfiles("", 1),
      listCompanies("", 1),
      listExperiences("", 1),
      listWorkflows("", 1),
    ]).then(([profiles, companies, experiences, workflows]) => {
      if (cancelled) return;
      const errors = [
        profiles.error,
        companies.error,
        experiences.error,
        workflows.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        toast(errors[0] ?? "Failed to check Generate prerequisites", "error");
        setLoading(false);
        setMissing([
          { label: "Profiles", href: "/profiles" },
          { label: "Companies", href: "/companies" },
          { label: "Experiences", href: "/experiences" },
          { label: "Workflows", href: "/workflows" },
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

      setMissing(nextMissing.length > 0 ? nextMissing : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) {
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
        <GenerateJobStep onAdvanceToPcew={() => setActiveStep("PCEW")} />
      ) : null}
      {activeStep === "PCEW" ? (
        <GeneratePcewStep
          selection={pcew}
          onSelectionChange={setPcew}
          onPrev={() => setActiveStep("Job")}
          onNext={() => {
            setActiveStep("Verdict");
            toast("PCEW selection saved for this session.", "success");
          }}
        />
      ) : null}
      {activeStep === "Verdict" ? (
        <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted">
          Verdict step is not implemented yet.
        </div>
      ) : null}
      {activeStep === "Company" ? (
        <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted">
          Company step is not implemented yet.
        </div>
      ) : null}
      {activeStep === "Generate" ? (
        <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted">
          Generate step is not implemented yet.
        </div>
      ) : null}
    </section>
  );
}
