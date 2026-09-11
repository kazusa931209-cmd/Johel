"use client";

import { useCallback, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { formatThousandsSeparated } from "@/lib/helper";
import { JOB_TEXT_MAX } from "@/lib/jobNoiseFilter";
import type { GenerateJobState } from "@/lib/generate-session";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

type GenerateJobStepProps = {
  job: GenerateJobState;
  onJobChange: (job: GenerateJobState) => void;
  onRunFromJob: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function GenerateJobStep({
  job,
  onJobChange,
  onRunFromJob,
}: GenerateJobStepProps) {
  const t = useT();
  const { jobText, jdCompanyName, jdJobRole } = job;
  const [jobError, setJobError] = useState<string | undefined>();
  const [jdCompanyNameError, setJdCompanyNameError] = useState<
    string | undefined
  >();
  const [jdRoleError, setJdRoleError] = useState<string | undefined>();

  function updateJob(patch: Partial<GenerateJobState>) {
    onJobChange({ ...job, ...patch });
  }

  function setJobTextCapped(value: string) {
    updateJob({ jobText: value.slice(0, JOB_TEXT_MAX) });
  }

  const onRun = useCallback(() => {
    const text = jobText.trim();
    const company = jdCompanyName.trim();
    const role = jdJobRole.trim();
    let hasError = false;

    if (!company) {
      setJdCompanyNameError(t("validation.jdCompanyNameRequired"));
      hasError = true;
    } else {
      setJdCompanyNameError(undefined);
    }

    if (!role) {
      setJdRoleError(t("validation.jdRoleRequired"));
      hasError = true;
    } else {
      setJdRoleError(undefined);
    }

    if (!text) {
      setJobError(t("validation.jobDescriptionRequired"));
      hasError = true;
    } else {
      setJobError(undefined);
    }

    if (hasError) return;
    onRunFromJob();
  }, [jdCompanyName, jdJobRole, jobText, onRunFromJob, t]);

  useRegisterGenerateStepNav({ onRun });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid shrink-0 gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>
            {t("generate.job.jdCompanyName")}
            <span className="ml-0.5 text-danger" aria-hidden>*</span>
          </span>
          <input
            type="text"
            value={jdCompanyName}
            onChange={(e) => {
              updateJob({ jdCompanyName: e.target.value });
              if (jdCompanyNameError) setJdCompanyNameError(undefined);
            }}
            placeholder={t("generate.job.jdCompanyNamePlaceholder")}
            aria-invalid={Boolean(jdCompanyNameError)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
          <FieldError message={jdCompanyNameError} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("generate.job.jdJobRole")}
            <span className="ml-0.5 text-danger" aria-hidden>*</span>
          </span>
          <input
            type="text"
            value={jdJobRole}
            onChange={(e) => {
              updateJob({ jdJobRole: e.target.value });
              if (jdRoleError) setJdRoleError(undefined);
            }}
            placeholder={t("generate.job.jdJobRolePlaceholder")}
            aria-invalid={Boolean(jdRoleError)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
          <FieldError message={jdRoleError} />
        </label>
      </div>

      <label className="flex min-h-0 flex-1 flex-col gap-1 text-sm">
        <span className="flex shrink-0 items-center justify-between gap-2">
          <span>
            {t("generate.job.jobDescription")}
            <span className="ml-0.5 text-danger" aria-hidden>*</span>
          </span>
          <span className="text-xs text-muted">
            {formatThousandsSeparated(jobText.length)}/
            {formatThousandsSeparated(JOB_TEXT_MAX)}
          </span>
        </span>
        <div className="relative min-h-0 flex-1">
          <textarea
            value={jobText}
            onChange={(e) => {
              setJobTextCapped(e.target.value);
              if (jobError) setJobError(undefined);
            }}
            maxLength={JOB_TEXT_MAX}
            placeholder={t("generate.job.placeholder")}
            aria-invalid={Boolean(jobError)}
            className="absolute inset-0 h-full w-full resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
        </div>
        <FieldError message={jobError} />
      </label>
    </div>
  );
}
