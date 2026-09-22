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
  const { jobText } = job;
  const [jobError, setJobError] = useState<string | undefined>();

  function updateJob(patch: Partial<GenerateJobState>) {
    onJobChange({ ...job, ...patch });
  }

  function setJobTextCapped(value: string) {
    updateJob({ jobText: value.slice(0, JOB_TEXT_MAX) });
  }

  const onRun = useCallback(() => {
    const text = jobText.trim();

    if (!text) {
      setJobError(t("validation.jobDescriptionRequired"));
      return;
    }

    setJobError(undefined);
    onRunFromJob();
  }, [jobText, onRunFromJob, t]);

  useRegisterGenerateStepNav({ onRun });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label className="flex min-h-0 flex-1 flex-col gap-1 text-sm">
        <span className="flex shrink-0 items-center justify-between gap-2">
          <span>
            {t("generate.job.jobDescription")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
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
