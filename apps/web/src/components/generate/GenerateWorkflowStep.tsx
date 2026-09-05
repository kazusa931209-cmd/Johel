"use client";

import { useCallback, useState } from "react";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { PcewSection } from "@/components/generate/PcewSection";
import {
  type WorkflowFieldErrors,
  type WorkflowSelection,
  validateWorkflowSelection,
} from "@/components/generate/pcew-types";
import { WorkflowDetailDialog } from "@/components/WorkflowDetailDialog";
import { listWorkflows, type Workflow } from "@/lib/api";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

type GenerateWorkflowStepProps = {
  acceptedMarkdown: string | null;
  selection: WorkflowSelection;
  generating: boolean;
  onSelectionChange: (selection: WorkflowSelection) => void;
  onPrev: () => void;
  onNext: () => void | Promise<void>;
};

function formatWorkflowDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function GenerateWorkflowStep({
  acceptedMarkdown,
  selection,
  generating,
  onSelectionChange,
  onPrev,
  onNext,
}: GenerateWorkflowStepProps) {
  const [fieldErrors, setFieldErrors] = useState<WorkflowFieldErrors>({});
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);

  const fetchWorkflows = useCallback(() => listWorkflows("", null), []);

  function onWorkflowSelect(id: string, row: Workflow) {
    onSelectionChange({ workflowId: id, workflowName: row.name });
    if (fieldErrors.workflowId) {
      setFieldErrors((errors) => ({ ...errors, workflowId: undefined }));
    }
  }

  const handleNext = useCallback(() => {
    const errors = validateWorkflowSelection(selection);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void onNext();
  }, [onNext, selection]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: handleNext,
    nextBusy: generating,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Workflow</h2>
        <p className="text-sm text-muted">
          Choose one workflow. Its saved profile, companies, and experiences
          are used for generation.
        </p>
      </div>

      {acceptedMarkdown ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">AI Verdict result</h3>
          <div className="rounded-md border border-border bg-background px-3 py-3">
            <AiVerdictMarkdown markdown={acceptedMarkdown} />
          </div>
        </div>
      ) : null}

      <PcewSection<Workflow>
        title="Workflow"
        emptyLabel="No workflows found."
        error={fieldErrors.workflowId}
        selectionMode="single"
        isSelected={(id) => selection.workflowId === id}
        onRowSelect={onWorkflowSelect}
        fetchAll={fetchWorkflows}
        loadErrorLabel="Failed to load workflows"
        viewing={viewingWorkflow}
        onView={setViewingWorkflow}
        minWidthClass="min-w-[720px]"
        columns={[
          {
            header: "Name",
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            header: "Description",
            className: "max-w-[220px] truncate text-muted",
            cell: (row) => row.description ?? "",
          },
          {
            header: "Updated",
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

      {generating ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">Generating Resume…</p>
            <p className="mt-1 text-xs text-muted">
              Please wait while the AI tailors your resume to the job.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
