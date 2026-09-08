"use client";

import { useCallback, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { PcewSection } from "@/components/generate/PcewSection";
import {
  type WorkflowFieldErrors,
  type WorkflowSelection,
  validateWorkflowSelection,
} from "@/components/generate/pcew-types";
import { WorkflowDetailDialog } from "@/components/WorkflowDetailDialog";
import { listWorkflows, saveLastSelectedWorkflow, type Workflow } from "@/lib/api";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

type GenerateWorkflowStepProps = {
  doVerdict: boolean;
  acceptedMarkdown: string | null;
  selection: WorkflowSelection;
  oneTimePrompt: string;
  generating: boolean;
  onSelectionChange: (selection: WorkflowSelection) => void;
  onOneTimePromptChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void | Promise<void>;
};

export function GenerateWorkflowStep({
  doVerdict,
  acceptedMarkdown,
  selection,
  oneTimePrompt,
  generating,
  onSelectionChange,
  onOneTimePromptChange,
  onPrev,
  onNext,
}: GenerateWorkflowStepProps) {
  const t = useT();
  const { locale } = useLocale();
  const [fieldErrors, setFieldErrors] = useState<WorkflowFieldErrors>({});
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);

  const fetchWorkflows = useCallback(() => listWorkflows("", null), []);

  function onWorkflowSelect(id: string, row: Workflow) {
    onSelectionChange({ workflowId: id, workflowName: row.name });
    void saveLastSelectedWorkflow(id);
    if (fieldErrors.workflowId) {
      setFieldErrors((errors) => ({ ...errors, workflowId: undefined }));
    }
  }

  const handleNext = useCallback(() => {
    const errors = validateWorkflowSelection(selection);
    if (errors.workflowId) {
      setFieldErrors({ workflowId: t("validation.workflowRequired") });
      return;
    }
    setFieldErrors({});
    void onNext();
  }, [onNext, selection, t]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: handleNext,
    nextBusy: generating,
  });

  function formatWorkflowDate(iso: string) {
    return new Date(iso).toLocaleString(locale);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("generate.workflow.title")}
        </h2>
        <p className="text-sm text-muted">
          {t("generate.workflow.description")}
          {doVerdict
            ? t("generate.workflow.descriptionWithVerdict")
            : t("generate.workflow.descriptionWithoutVerdict")}
        </p>
      </div>

      {acceptedMarkdown ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("generate.workflow.verdictResult.title")}
          </h3>
          <p className="text-xs text-muted">
            {t("generate.workflow.verdictResult.description")}
          </p>
          <div className="rounded-md border border-border bg-background px-3 py-3">
            <AiVerdictMarkdown markdown={acceptedMarkdown} />
          </div>
        </div>
      ) : null}

      <PcewSection<Workflow>
        title={t("generate.workflow.sectionTitle")}
        emptyLabel={t("generate.workflow.emptyWorkflows")}
        error={fieldErrors.workflowId}
        selectionMode="single"
        isSelected={(id) => selection.workflowId === id}
        onRowSelect={onWorkflowSelect}
        fetchAll={fetchWorkflows}
        loadErrorLabel={t("generate.workflow.loadError")}
        viewing={viewingWorkflow}
        onView={setViewingWorkflow}
        minWidthClass="min-w-[720px]"
        columns={[
          {
            header: t("generate.workflow.columns.name"),
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            header: t("generate.workflow.columns.description"),
            className: "max-w-[220px] truncate text-muted",
            cell: (row) => row.description ?? "",
          },
          {
            header: t("generate.workflow.columns.updated"),
            className: "whitespace-nowrap text-muted",
            cell: (row) => formatWorkflowDate(row.updatedAt),
          },
        ]}
        renderDetailDialog={(row) => (
          <WorkflowDetailDialog
            workflowId={row.id}
            onClose={() => setViewingWorkflow(null)}
          />
        )}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {t("generate.workflow.oneTimePrompt.title")}
        </h3>
        <p className="text-sm text-muted">
          {t("generate.workflow.oneTimePrompt.description")}
        </p>
        <label className="block space-y-1 text-sm">
          <span className="sr-only">
            {t("generate.workflow.oneTimePrompt.label")}
          </span>
          <textarea
            value={oneTimePrompt}
            onChange={(e) => onOneTimePromptChange(e.target.value)}
            rows={8}
            placeholder={t("generate.workflow.oneTimePrompt.placeholder")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
        </label>
      </div>

      {generating ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.workflow.generating.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.workflow.generating.description")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
