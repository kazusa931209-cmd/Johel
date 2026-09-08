"use client";

import { useEffect, useState } from "react";
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
import { WorkflowCompanyDialog } from "@/components/WorkflowCompanyDialog";
import { listCompanies, listExperiences } from "@/lib/api";
import {
  formatWorkflowPeriod,
  type WorkflowCompanyEntry,
} from "@/lib/workflow";

type WorkflowCompaniesEditorProps = {
  companies: WorkflowCompanyEntry[];
  onChange: (companies: WorkflowCompanyEntry[]) => void;
  error?: string;
  onClearError?: () => void;
};

export function WorkflowCompaniesEditor({
  companies,
  onChange,
  error,
  onClearError,
}: WorkflowCompaniesEditorProps) {
  const t = useT();
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [experienceLabelById, setExperienceLabelById] = useState<
    Map<string, string>
  >(new Map());
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCompanies("", null), listExperiences("", null)]).then(
      ([companiesRes, experiencesRes]) => {
        if (cancelled) return;
        setCompanyNameById(
          new Map(
            (companiesRes.data?.items ?? []).map((item) => [item.id, item.name]),
          ),
        );
        setExperienceLabelById(
          new Map(
            (experiencesRes.data?.items ?? []).map((item) => [
              item.id,
              item.category,
            ]),
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setEditIndex(null);
    setDialog("add");
  }

  function openEdit(index: number) {
    setEditIndex(index);
    setDialog("edit");
  }

  function saveEntry(entry: WorkflowCompanyEntry) {
    if (dialog === "edit" && editIndex !== null) {
      onChange(companies.map((row, i) => (i === editIndex ? entry : row)));
    } else {
      onChange([...companies, entry]);
    }
    onClearError?.();
    setDialog(null);
  }

  function experienceSummary(entry: WorkflowCompanyEntry): string {
    const labels = entry.experienceIds
      .map((id) => experienceLabelById.get(id))
      .filter((label): label is string => Boolean(label));
    if (labels.length === 0) {
      return t("crud.workflows.companiesEditor.selectedCount", {
        count: entry.experienceIds.length,
      });
    }
    if (labels.length <= 2) {
      return labels.join(", ");
    }
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  }

  const excludedCompanyIds =
    dialog === "add"
      ? companies.map((entry) => entry.companyId)
      : companies
          .map((entry) => entry.companyId)
          .filter((_, index) => index !== editIndex);

  const dialogInitial: WorkflowCompanyEntry =
    dialog === "edit" && editIndex !== null
      ? companies[editIndex]
      : {
          companyId: "",
          startDate: "",
          endDate: "",
          roleContext: "",
          experienceIds: [],
        };

  const editingCompanyName =
    dialog === "edit" && editIndex !== null
      ? companyNameById.get(companies[editIndex].companyId)
      : undefined;

  const deletingCompanyName =
    deletingIndex !== null
      ? companyNameById.get(companies[deletingIndex]?.companyId ?? "") ??
        t("crud.workflows.companiesEditor.thisCompany")
      : "";

  const viewingEntry =
    viewingIndex !== null ? companies[viewingIndex] : null;
  const viewingCompanyName = viewingEntry
    ? companyNameById.get(viewingEntry.companyId) ?? viewingEntry.companyId
    : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">
            {t("crud.workflows.form.companies")}
          </h2>
          <p className="text-xs text-muted">
            {t("crud.workflows.companiesEditor.draftHint")}
          </p>
        </div>
        <AddButton onClick={openAdd} />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.companiesEditor.company")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.companiesEditor.period")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.companiesEditor.experiences")}
              </th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  {t("crud.workflows.companiesEditor.empty")}
                </td>
              </tr>
            ) : (
              companies.map((entry, index) => (
                <tr
                  key={`${entry.companyId}-${index}`}
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => setViewingIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewingIndex(index);
                    }
                  }}
                >
                  <td className="px-3 py-2 font-medium">
                    {companyNameById.get(entry.companyId) ?? entry.companyId}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatWorkflowPeriod(entry.startDate, entry.endDate)}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-muted">
                    {experienceSummary(entry)}
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

      {viewingEntry ? (
        <DetailDialog
          title={viewingCompanyName}
          onClose={() => setViewingIndex(null)}
        >
          <DetailField
            label={t("crud.workflows.companiesEditor.period")}
            value={formatWorkflowPeriod(
              viewingEntry.startDate,
              viewingEntry.endDate,
            )}
          />
          <DetailField
            label={t("crud.workflows.companiesEditor.roleContext")}
            value={viewingEntry.roleContext}
          />
          <div className="space-y-1">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("crud.workflows.companiesEditor.experiences")}
            </div>
            {viewingEntry.experienceIds.length === 0 ? (
              <p className="text-sm text-muted">
                {t("crud.workflows.noExperiencesLinked")}
              </p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                {viewingEntry.experienceIds.map((id) => (
                  <li key={id}>
                    {experienceLabelById.get(id) ?? id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DetailDialog>
      ) : null}

      {dialog ? (
        <WorkflowCompanyDialog
          mode={dialog}
          initial={dialogInitial}
          companyName={editingCompanyName}
          excludedCompanyIds={excludedCompanyIds}
          onSave={saveEntry}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {deletingIndex !== null ? (
        <DetailDialog
          title={t("crud.workflows.companiesEditor.deleteEntry")}
          role="alertdialog"
          onClose={() => setDeletingIndex(null)}
        >
          <p className="text-muted">
            {t("crud.workflows.companiesEditor.deleteDraftBody", {
              name: deletingCompanyName,
            })}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange(companies.filter((_, i) => i !== deletingIndex));
                onClearError?.();
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
