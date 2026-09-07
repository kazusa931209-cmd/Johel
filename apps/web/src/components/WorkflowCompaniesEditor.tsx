"use client";

import { useEffect, useState } from "react";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import {
  DetailDialog,
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
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [experienceLabelById, setExperienceLabelById] = useState<
    Map<string, string>
  >(new Map());
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

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
      return `${entry.experienceIds.length} selected`;
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
          experienceIds: [],
        };

  const editingCompanyName =
    dialog === "edit" && editIndex !== null
      ? companyNameById.get(companies[editIndex].companyId)
      : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Companies</h2>
          <p className="text-xs text-muted">
            Add company entries with period and linked experiences. Edits stay
            on this page until you Save the workflow.
          </p>
        </div>
        <AddButton onClick={openAdd} />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Experiences</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  No company entries yet.
                </td>
              </tr>
            ) : (
              companies.map((entry, index) => (
                <tr
                  key={`${entry.companyId}-${index}`}
                  className={TABLE_ROW_HOVER_CLASS}
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
          title="Delete company entry"
          role="alertdialog"
          onClose={() => setDeletingIndex(null)}
        >
          <p className="text-muted">
            Remove “
            {companyNameById.get(companies[deletingIndex]?.companyId ?? "") ??
              "this company"}
            ” from this workflow? It is stored only when you Save the workflow.
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
              Delete
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </div>
  );
}
