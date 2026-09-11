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

function ComingSoonAlert({ methodLabel }: { methodLabel: string }) {
  const t = useT();

  return (
    <div
      role="status"
      className="rounded-md border border-border bg-toast-info-bg px-3 py-3 text-sm text-toast-info-fg"
    >
      <p className="font-medium">
        {t("generate.job.comingSoon.notImplemented", { method: methodLabel })}
      </p>
      <p className="mt-1 opacity-90">{t("generate.job.comingSoon.soon")}</p>
    </div>
  );
}

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
  const { method, jobText, jdCompanyName, jdJobRole } = job;
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

  useRegisterGenerateStepNav({
    onRun: method === "manual" ? onRun : undefined,
  });

  const methodLabels = {
    manual: t("generate.job.methods.manual"),
    url: t("generate.job.methods.url"),
    file: t("generate.job.methods.fileUpload"),
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap gap-1 rounded-md border border-border p-1">
        {(
          [
            ["manual", methodLabels.manual],
            ["url", methodLabels.url],
            ["file", methodLabels.file],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => updateJob({ method: id })}
            className={`rounded-md px-3 py-1.5 text-sm ${
              method === id
                ? "bg-surface-muted font-medium text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {method === "url" ? (
        <ComingSoonAlert methodLabel={methodLabels.url} />
      ) : null}
      {method === "file" ? (
        <ComingSoonAlert methodLabel={methodLabels.file} />
      ) : null}

      {method === "manual" ? (
        <div className="grid shrink-0 gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>{t("generate.job.jdCompanyName")}</span>
            <input
              type="text"
              value={jdCompanyName}
              onChange={(e) => updateJob({ jdCompanyName: e.target.value })}
              placeholder={t("generate.job.jdCompanyNamePlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t("generate.job.jdJobRole")}</span>
            <input
              type="text"
              value={jdJobRole}
              onChange={(e) => updateJob({ jdJobRole: e.target.value })}
              placeholder={t("generate.job.jdJobRolePlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
            />
          </label>
        </div>
      ) : null}

      {method === "manual" ? (
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
      ) : null}
    </div>
  );
}
