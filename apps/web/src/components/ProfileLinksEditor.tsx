"use client";

import { useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
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
  const t = useT();
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<LinkDraft>({ key: "", link: "" });
  const [keyError, setKeyError] = useState<string | undefined>();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [viewing, setViewing] = useState<ProfileLinkItem | null>(null);

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
      setKeyError(t("validation.keyRequired"));
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
      setKeyError(t("validation.keyUnique"));
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
          <h2 className="text-sm font-medium">
            {t("crud.profiles.links.title")}
          </h2>
          <p className="text-xs text-muted">
            {t("crud.profiles.links.draftHint")}
          </p>
        </div>
        <AddButton onClick={openAdd} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("crud.common.key")}</th>
              <th className="px-3 py-2 font-medium">
                {t("crud.common.value")}
              </th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted">
                  {t("crud.profiles.links.empty")}
                </td>
              </tr>
            ) : (
              links.map((row, index) => (
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
                    {row.link ?? ""}
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
        <DetailDialog
          title={t("crud.profiles.links.linkDetail")}
          onClose={() => setViewing(null)}
        >
          <DetailField label={t("crud.common.key")} value={viewing.key} />
          <DetailField label={t("crud.common.value")} value={viewing.link} />
        </DetailDialog>
      ) : null}

      {dialog ? (
        <DetailDialog
          mode="form"
          title={
            dialog === "add"
              ? t("crud.profiles.links.addLink")
              : t("crud.profiles.links.editLink")
          }
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
              {t("crud.common.key")}
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
            <span>{t("crud.common.value")}</span>
            <input
              value={draft.link}
              onChange={(e) =>
                setDraft((d) => ({ ...d, link: e.target.value }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={applyDialog}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
            >
              {t("crud.common.apply")}
            </button>
          </div>
        </DetailDialog>
      ) : null}

      {deletingIndex !== null ? (
        <DetailDialog
          title={t("crud.profiles.links.deleteLink")}
          role="alertdialog"
          onClose={() => setDeletingIndex(null)}
        >
          <p className="text-muted">
            {t("crud.profiles.links.deleteDraftBody", {
              key: links[deletingIndex]?.key ?? "",
            })}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange(links.filter((_, i) => i !== deletingIndex));
                setDeletingIndex(null);
              }}
              className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg"
            >
              {t("crud.common.delete")}
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </div>
  );
}
