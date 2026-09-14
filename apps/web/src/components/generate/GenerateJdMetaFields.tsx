"use client";

import { useT } from "@/components/app/LocaleProvider";
import type { GenerateJdMetaFieldErrors } from "@/lib/jd-meta-validation";

export type { GenerateJdMetaFieldErrors } from "@/lib/jd-meta-validation";

type GenerateJdMetaFieldsProps = {
  jdCompanyName: string;
  jdJobRole: string;
  onChange: (patch: { jdCompanyName?: string; jdJobRole?: string }) => void;
  errors?: GenerateJdMetaFieldErrors;
  readOnly?: boolean;
};

const LABEL_CLASS = "w-44 shrink-0";
const FIELD_CLASS =
  "min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

type JdMetaFieldRowProps = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  readOnly: boolean;
  error?: string;
  onChange: (value: string) => void;
};

function JdMetaFieldRow({
  label,
  required = false,
  value,
  placeholder,
  readOnly,
  error,
  onChange,
}: JdMetaFieldRowProps) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-3">
        <span className={LABEL_CLASS}>
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </span>
        {readOnly ? (
          <p className={`${FIELD_CLASS} text-foreground`}>
            {value.trim() || "—"}
          </p>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            className={FIELD_CLASS}
          />
        )}
      </div>
      {error ? (
        <div className="flex gap-3">
          <span className={LABEL_CLASS} aria-hidden />
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

export function GenerateJdMetaFields({
  jdCompanyName,
  jdJobRole,
  onChange,
  errors,
  readOnly = false,
}: GenerateJdMetaFieldsProps) {
  const t = useT();

  return (
    <div className="shrink-0 space-y-4">
      <JdMetaFieldRow
        label={t("generate.job.jdCompanyName")}
        required
        value={jdCompanyName}
        placeholder={t("generate.job.jdCompanyNamePlaceholder")}
        readOnly={readOnly}
        error={errors?.jdCompanyName}
        onChange={(next) => onChange({ jdCompanyName: next })}
      />
      <JdMetaFieldRow
        label={t("generate.job.jdJobRole")}
        required
        value={jdJobRole}
        placeholder={t("generate.job.jdJobRolePlaceholder")}
        readOnly={readOnly}
        error={errors?.jdJobRole}
        onChange={(next) => onChange({ jdJobRole: next })}
      />
    </div>
  );
}
