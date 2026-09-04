"use client";

import { useState } from "react";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import type { ProfileLinkItem } from "@/lib/profile";

type ProfileLinksEditorProps = {
  links: ProfileLinkItem[];
  onChange: (links: ProfileLinkItem[]) => void;
};

type LinkDraft = {
  key: string;
  link: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

export function ProfileLinksEditor({
  links,
  onChange,
}: ProfileLinksEditorProps) {
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<LinkDraft>({ key: "", link: "" });
  const [keyError, setKeyError] = useState<string | undefined>();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  function openAdd() {
    setEditIndex(null);
    setDraft({ key: "", link: "" });
    setKeyError(undefined);
    setDialog("add");
  }

  function openEdit(index: number) {
    const row = links[index];
    setEditIndex(index);
    setDraft({ key: row.key, link: row.link ?? "" });
    setKeyError(undefined);
    setDialog("edit");
  }

  function applyDialog() {
    const key = draft.key.trim();
    if (!key) {
      setKeyError("Key is required.");
      return;
    }
    const nextItem: ProfileLinkItem = {
      key,
      link: draft.link.trim() || null,
    };
    const duplicate = links.some(
      (item, i) =>
        item.key.toLowerCase() === key.toLowerCase() && i !== editIndex,
    );
    if (duplicate) {
      setKeyError("Link keys must be unique.");
      return;
    }
    if (dialog === "edit" && editIndex !== null) {
      onChange(links.map((row, i) => (i === editIndex ? nextItem : row)));
    } else {
      onChange([...links, nextItem]);
    }
    setDialog(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Links</h2>
          <p className="text-xs text-muted">
            Edits stay on this page until you Save the profile.
          </p>
        </div>
        <AddButton onClick={openAdd} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Key</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted">
                  No links yet.
                </td>
              </tr>
            ) : (
              links.map((row, index) => (
                <tr
                  key={`${row.key}-${index}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 font-medium">{row.key}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-muted">
                    {row.link ?? ""}
                  </td>
                  <td className="px-3 py-2">
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

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md space-y-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyDialog();
              }
            }}
          >
            <h2 className="text-lg font-semibold">
              {dialog === "add" ? "Add link" : "Edit link"}
            </h2>
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
              <span>Value</span>
              <input
                value={draft.link}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, link: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={applyDialog}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setDeletingIndex(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Delete link</h2>
              <p className="text-sm text-muted">
                Remove link key “{links[deletingIndex]?.key}” from this form? It
                is stored only when you Save the profile.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(links.filter((_, i) => i !== deletingIndex));
                  setDeletingIndex(null);
                }}
                className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
