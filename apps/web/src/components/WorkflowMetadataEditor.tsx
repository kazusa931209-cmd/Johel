"use client";

import { useState } from "react";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import {
  DetailDialog,
  DetailField,
  TABLE_ROW_HOVER_CLASS,
} from "@/components/shared/detail-dialog";
import { formatThousandsSeparated } from "@/lib/helper";
import type { WorkflowMetadataItem } from "@/lib/workflow";

type WorkflowMetadataEditorProps = {
  metadata: WorkflowMetadataItem[];
  onChange: (metadata: WorkflowMetadataItem[]) => void;
};

type MetaDraft = {
  key: string;
  rulePrompt: string;
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

export function WorkflowMetadataEditor({
  metadata,
  onChange,
}: WorkflowMetadataEditorProps) {
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<MetaDraft>({ key: "", rulePrompt: "" });
  const [keyError, setKeyError] = useState<string | undefined>();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [viewing, setViewing] = useState<WorkflowMetadataItem | null>(null);

  function openAdd() {
    setEditIndex(null);
    setDraft({ key: "", rulePrompt: "" });
    setKeyError(undefined);
    setDialog("add");
  }

  function openEdit(index: number) {
    const row = metadata[index];
    setEditIndex(index);
    setDraft({ key: row.key, rulePrompt: row.rulePrompt ?? "" });
    setKeyError(undefined);
    setDialog("edit");
  }

  function applyDialog() {
    const key = draft.key.trim();
    if (!key) {
      setKeyError("Key is required.");
      return;
    }
    const rulePrompt = draft.rulePrompt.trim().slice(0, 1024);
    const nextItem: WorkflowMetadataItem = {
      key,
      rulePrompt: rulePrompt || null,
    };
    const duplicate = metadata.some(
      (item, i) =>
        item.key.toLowerCase() === key.toLowerCase() && i !== editIndex,
    );
    if (duplicate) {
      setKeyError("Metadata keys must be unique.");
      return;
    }
    if (dialog === "edit" && editIndex !== null) {
      onChange(metadata.map((row, i) => (i === editIndex ? nextItem : row)));
    } else {
      onChange([...metadata, nextItem]);
    }
    setDialog(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Metadata</h2>
          <p className="text-xs text-muted">
            Edits stay on this page until you Save the workflow.
          </p>
        </div>
        <AddButton onClick={openAdd} />
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
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => setViewing(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewing(row);
                    }
                  }}
                >
                  <td className="px-3 py-2 font-medium">{row.key}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-muted">
                    {row.rulePrompt ?? ""}
                  </td>
                  <td
                    className="cursor-default px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <EditButton onClick={() => openEdit(index)} />
                      <DeleteButton onClick={() => setDeletingIndex(index)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <DetailDialog title="Metadata detail" onClose={() => setViewing(null)}>
          <DetailField label="Key" value={viewing.key} />
          <DetailField label="Rule prompt" value={viewing.rulePrompt} />
        </DetailDialog>
      ) : null}

      {dialog ? (
        <DetailDialog
          title={dialog === "add" ? "Add metadata" : "Edit metadata"}
          onClose={() => setDialog(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyDialog();
            }
          }}
        >
          <label className="block space-y-1 text-sm">
            <span>
              Key
              <RequiredMark />
            </span>
            <input
              value={draft.key}
              onChange={(e) => {
                setDraft((d) => ({ ...d, key: e.target.value }));
                if (keyError) setKeyError(undefined);
              }}
              aria-invalid={Boolean(keyError)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
            <FieldError message={keyError} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Rule prompt</span>
            <textarea
              maxLength={1024}
              value={draft.rulePrompt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, rulePrompt: e.target.value }))
              }
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
            <span className="text-xs text-muted">
              {formatThousandsSeparated(draft.rulePrompt.length)}/
              {formatThousandsSeparated(1024)}
            </span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={applyDialog}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
            >
              Apply
            </button>
          </div>
        </DetailDialog>
      ) : null}

      {deletingIndex !== null ? (
        <DetailDialog
          title="Delete metadata"
          role="alertdialog"
          onClose={() => setDeletingIndex(null)}
        >
          <p className="text-muted">
            Remove metadata key “{metadata[deletingIndex]?.key}” from this form?
            It is stored only when you Save the workflow.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange(metadata.filter((_, i) => i !== deletingIndex));
                setDeletingIndex(null);
              }}
              className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg"
            >
              Delete
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </div>
  );
}
