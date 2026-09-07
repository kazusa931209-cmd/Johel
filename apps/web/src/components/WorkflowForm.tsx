"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { toast } = useToast();
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
      nextErrors.name = "Name is required.";
    }
    Object.assign(
      nextErrors,
      validateWorkflowEditorContent({ profileId, companies }),
    );
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: WorkflowWritePayload = {
      name: name.trim(),
      description: description.trim() || null,
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
      toast(res.error ?? "Save failed", "error");
      return;
    }
    toast(
      mode === "edit" ? "Workflow updated." : "Workflow created.",
      "success",
    );
    router.push("/workflows");
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton href="/workflows" aria-label="Back to workflows" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit workflow" : "Add workflow"}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          Configure language, choose a profile, and add company entries with
          period and linked experiences for this workflow preset.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          Name
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
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Language</span>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as WorkflowLanguage)}
            className="w-full appearance-none rounded-md border border-border bg-background py-2 pr-10 pl-3 outline-none focus:border-muted"
          >
            {WORKFLOW_LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
          onClick={() => router.push("/workflows")}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
