"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
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
  const [metaDialog, setMetaDialog] = useState<"add" | "edit" | null>(null);
  const [metaEditIndex, setMetaEditIndex] = useState<number | null>(null);
  const [metaDraft, setMetaDraft] = useState<MetaDraft>({
    key: "",
    rulePrompt: "",
  });
  const [deletingMetaIndex, setDeletingMetaIndex] = useState<number | null>(
    null,
  );

  function openAddMeta() {
    setMetaEditIndex(null);
    setMetaDraft({ key: "", rulePrompt: "" });
    setMetaDialog("add");
  }

  function openEditMeta(index: number) {
    const row = metadata[index];
    setMetaEditIndex(index);
    setMetaDraft({
      key: row.key,
      rulePrompt: row.rulePrompt ?? "",
    });
    setMetaDialog("edit");
  }

  function saveMetaDialog(e: FormEvent) {
    e.preventDefault();
    const key = metaDraft.key.trim();
    if (!key) return;
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
      toast("Metadata keys must be unique", "error");
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
    const payload: WorkflowWritePayload = {
      name: name.trim(),
      description: description.trim() || null,
      language,
      filteringPrompt: filteringPrompt.trim(),
      metadata,
    };
    if (!payload.name || !payload.filteringPrompt) {
      toast("Name and Filtering Prompt are required", "warning");
      return;
    }
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
      <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit workflow" : "Add workflow"}
          </h1>
          <p className="text-sm text-muted">
            Configure language, filtering, and metadata for this workflow.
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
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
            <span>Filtering Prompt</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilteringPrompt(DEFAULT_FILTERING_PROMPT)}
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
            required
            value={filteringPrompt}
            onChange={(e) => setFilteringPrompt(e.target.value)}
            placeholder={FILTERING_PROMPT_PLACEHOLDER}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Metadata</h2>
            <button
              type="button"
              onClick={openAddMeta}
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
            >
              Add
            </button>
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
                          <button
                            type="button"
                            onClick={() => openEditMeta(index)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMetaIndex(index)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                          >
                            Delete
                          </button>
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
            disabled={
              saving ||
              name.trim().length === 0 ||
              filteringPrompt.trim().length === 0
            }
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {metaDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={saveMetaDialog}
            className="w-full max-w-md space-y-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
          >
            <h2 className="text-lg font-semibold">
              {metaDialog === "add" ? "Add metadata" : "Edit metadata"}
            </h2>
            <label className="block space-y-1 text-sm">
              <span>Key</span>
              <input
                required
                value={metaDraft.key}
                onChange={(e) =>
                  setMetaDraft((draft) => ({ ...draft, key: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
              />
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={metaDraft.key.trim().length === 0}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
              >
                Save
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
                Delete metadata key “{metadata[deletingMetaIndex]?.key}”?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingMetaIndex(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
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
