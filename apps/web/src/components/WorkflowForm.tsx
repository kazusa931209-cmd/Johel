"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import { useToast } from "@/components/app/ToastProvider";
import {
  createWorkflow,
  updateWorkflow,
  type WorkflowDetail,
  type WorkflowWritePayload,
} from "@/lib/api";
import {
  DEFAULT_FILTERING_PROMPT,
  FILTERING_PROMPT_PLACEHOLDER,
  WORKFLOW_LANGUAGES,
  type WorkflowLanguage,
  type WorkflowMetadataItem,
} from "@/lib/workflow";

type WorkflowFormProps = {
  mode: "create" | "edit";
  workflowId?: string;
  initial?: Partial<WorkflowDetail>;
};

type MetaDraft = {
  key: string;
  rulePrompt: string;
};

type FieldErrors = {
  name?: string;
  filteringPrompt?: string;
};

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
  const [filteringPrompt, setFilteringPrompt] = useState(
    initial?.filteringPrompt ?? "",
  );
  const [metadata, setMetadata] = useState<WorkflowMetadataItem[]>(
    initial?.metadata ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [metaDialog, setMetaDialog] = useState<"add" | "edit" | null>(null);
  const [metaEditIndex, setMetaEditIndex] = useState<number | null>(null);
  const [metaDraft, setMetaDraft] = useState<MetaDraft>({
    key: "",
    rulePrompt: "",
  });
  const [metaKeyError, setMetaKeyError] = useState<string | undefined>();
  const [deletingMetaIndex, setDeletingMetaIndex] = useState<number | null>(
    null,
  );

  function openAddMeta() {
    setMetaEditIndex(null);
    setMetaDraft({ key: "", rulePrompt: "" });
    setMetaKeyError(undefined);
    setMetaDialog("add");
  }

  function openEditMeta(index: number) {
    const row = metadata[index];
    setMetaEditIndex(index);
    setMetaDraft({
      key: row.key,
      rulePrompt: row.rulePrompt ?? "",
    });
    setMetaKeyError(undefined);
    setMetaDialog("edit");
  }

  function applyMetaDialog(e: FormEvent) {
    e.preventDefault();
    const key = metaDraft.key.trim();
    if (!key) {
      setMetaKeyError("Key is required.");
      return;
    }
    const rulePrompt = metaDraft.rulePrompt.trim().slice(0, 1024);
    const nextItem: WorkflowMetadataItem = {
      key,
      rulePrompt: rulePrompt || null,
    };
    const duplicate = metadata.some(
      (item, i) =>
        item.key.toLowerCase() === key.toLowerCase() && i !== metaEditIndex,
    );
    if (duplicate) {
      setMetaKeyError("Metadata keys must be unique.");
      return;
    }
    if (metaDialog === "edit" && metaEditIndex !== null) {
      setMetadata((rows) =>
        rows.map((row, i) => (i === metaEditIndex ? nextItem : row)),
      );
    } else {
      setMetadata((rows) => [...rows, nextItem]);
    }
    setMetaDialog(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }
    if (!filteringPrompt.trim()) {
      nextErrors.filteringPrompt = "Filtering Prompt is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: WorkflowWritePayload = {
      name: name.trim(),
      description: description.trim() || null,
      language,
      filteringPrompt: filteringPrompt.trim(),
      metadata,
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
    <>
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
            Configure language, filtering, and metadata for this workflow.
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

        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Filtering Prompt
              <RequiredMark />
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilteringPrompt(DEFAULT_FILTERING_PROMPT);
                  if (fieldErrors.filteringPrompt) {
                    setFieldErrors((errors) => ({
                      ...errors,
                      filteringPrompt: undefined,
                    }));
                  }
                }}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
              >
                Use Default
              </button>
              <button
                type="button"
                onClick={() => setFilteringPrompt("")}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
              >
                Reset
              </button>
            </div>
          </div>
          <textarea
            value={filteringPrompt}
            onChange={(e) => {
              setFilteringPrompt(e.target.value);
              if (fieldErrors.filteringPrompt) {
                setFieldErrors((errors) => ({
                  ...errors,
                  filteringPrompt: undefined,
                }));
              }
            }}
            placeholder={FILTERING_PROMPT_PLACEHOLDER}
            rows={4}
            aria-invalid={Boolean(fieldErrors.filteringPrompt)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.filteringPrompt} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Metadata</h2>
              <p className="text-xs text-muted">
                Edits stay on this page until you Save the workflow.
              </p>
            </div>
            <AddButton onClick={openAddMeta} />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Rule prompt</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {metadata.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-muted">
                      No metadata yet.
                    </td>
                  </tr>
                ) : (
                  metadata.map((row, index) => (
                    <tr
                      key={`${row.key}-${index}`}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 font-medium">{row.key}</td>
                      <td className="max-w-[280px] truncate px-3 py-2 text-muted">
                        {row.rulePrompt ?? ""}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <EditButton onClick={() => openEditMeta(index)} />
                          <DeleteButton
                            onClick={() => setDeletingMetaIndex(index)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
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

      {metaDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            noValidate
            onSubmit={applyMetaDialog}
            className="w-full max-w-md space-y-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
          >
            <h2 className="text-lg font-semibold">
              {metaDialog === "add" ? "Add metadata" : "Edit metadata"}
            </h2>
            <label className="block space-y-1 text-sm">
              <span>
                Key
                <RequiredMark />
              </span>
              <input
                value={metaDraft.key}
                onChange={(e) => {
                  setMetaDraft((draft) => ({ ...draft, key: e.target.value }));
                  if (metaKeyError) setMetaKeyError(undefined);
                }}
                aria-invalid={Boolean(metaKeyError)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
              />
              <FieldError message={metaKeyError} />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Rule prompt</span>
              <textarea
                maxLength={1024}
                value={metaDraft.rulePrompt}
                onChange={(e) =>
                  setMetaDraft((draft) => ({
                    ...draft,
                    rulePrompt: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
              />
              <span className="text-xs text-muted">
                {metaDraft.rulePrompt.length}/1024
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMetaDialog(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deletingMetaIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setDeletingMetaIndex(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Delete metadata</h2>
              <p className="text-sm text-muted">
                Remove metadata key “{metadata[deletingMetaIndex]?.key}” from
                this form? It is stored only when you Save the workflow.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingMetaIndex(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetadata((rows) =>
                    rows.filter((_, i) => i !== deletingMetaIndex),
                  );
                  setDeletingMetaIndex(null);
                }}
                className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
