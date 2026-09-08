"use client";

import { FormEvent, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { BackButton } from "@/components/shared/back-button";
import { WorkflowCompaniesEditor } from "@/components/WorkflowCompaniesEditor";
import { WorkflowProfilePicker } from "@/components/WorkflowPcewPicker";
import { useToast } from "@/components/app/ToastProvider";
import {
  createWorkflow,
  updateWorkflow,
  type WorkflowDetail,
  type WorkflowWritePayload,
} from "@/lib/api";
import { useCrudFormNavigation } from "@/lib/crud-form-navigation";
import {
  WORKFLOW_LANGUAGES,
  validateWorkflowEditorContent,
  type WorkflowCompanyEntry,
  type WorkflowEditorFieldErrors,
  type WorkflowLanguage,
} from "@/lib/workflow";

type WorkflowFormProps = {
  mode: "create" | "edit";
  workflowId?: string;
  initial?: Partial<WorkflowDetail>;
};

type FieldErrors = {
  name?: string;
  description?: string;
} & WorkflowEditorFieldErrors;

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function WorkflowForm({ mode, workflowId, initial }: WorkflowFormProps) {
  const t = useT();
  const { toast } = useToast();
  const { goBack } = useCrudFormNavigation("/workflows");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [language, setLanguage] = useState<WorkflowLanguage>(
    (initial?.language as WorkflowLanguage) || "en",
  );
  const [profileId, setProfileId] = useState(initial?.profileId ?? "");
  const [companies, setCompanies] = useState<WorkflowCompanyEntry[]>(
    initial?.companies ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = t("validation.nameRequired");
    }
    if (!description.trim()) {
      nextErrors.description = t("validation.descriptionRequired");
    }
    Object.assign(
      nextErrors,
      validateWorkflowEditorContent({ profileId, companies }, t),
    );
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: WorkflowWritePayload = {
      name: name.trim(),
      description: description.trim(),
      language,
      profileId,
      companies,
    };
    setSaving(true);
    const res =
      mode === "edit" && workflowId
        ? await updateWorkflow(workflowId, payload)
        : await createWorkflow(payload);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.workflowSaveFailed"), "error");
      return;
    }
    toast(
      mode === "edit" ? t("toast.workflowUpdated") : t("toast.workflowCreated"),
      "success",
    );
    goBack();
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton
            href="/workflows"
            preferHistoryBack
            aria-label={t("crud.workflows.form.backAria")}
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit"
              ? t("crud.workflows.form.editTitle")
              : t("crud.workflows.form.addTitle")}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          {t("crud.workflows.form.description")}
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.workflows.form.name")}
          <RequiredMark />
        </span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              setFieldErrors((errors) => ({ ...errors, name: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.name)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.name} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.common.description")}
          <RequiredMark />
        </span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (fieldErrors.description) {
              setFieldErrors((errors) => ({
                ...errors,
                description: undefined,
              }));
            }
          }}
          rows={6}
          aria-invalid={Boolean(fieldErrors.description)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <p className="text-xs text-muted">
          {t("guidance.descriptionAsResumePrompt")}
        </p>
        <FieldError message={fieldErrors.description} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.workflows.form.language")}</span>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as WorkflowLanguage)}
            className="w-full appearance-none rounded-md border border-border bg-background py-2 pr-10 pl-3 outline-none focus:border-muted"
          >
            {WORKFLOW_LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`crud.workflows.form.languages.${option.value}`)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </label>

      <WorkflowProfilePicker
        profileId={profileId}
        onProfileIdChange={setProfileId}
        fieldErrors={fieldErrors}
        onClearError={() => {
          if (fieldErrors.profileId) {
            setFieldErrors((errors) => ({ ...errors, profileId: undefined }));
          }
        }}
      />

      <WorkflowCompaniesEditor
        companies={companies}
        onChange={setCompanies}
        error={fieldErrors.companies}
        onClearError={() => {
          if (fieldErrors.companies) {
            setFieldErrors((errors) => ({ ...errors, companies: undefined }));
          }
        }}
      />

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={goBack}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.cancel")}
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {saving ? t("crud.common.saving") : t("crud.common.save")}
        </button>
      </div>
    </form>
  );
}
