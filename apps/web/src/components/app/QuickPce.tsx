"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { Drawer } from "@/components/shared/drawer";
import { PcewSection } from "@/components/generate/PcewSection";
import {
  EMPTY_WORKFLOW_SELECTION,
  type WorkflowSelection,
} from "@/components/generate/pcew-types";
import { WorkflowDetailDialog } from "@/components/WorkflowDetailDialog";
import {
  applyAuthorAdvise,
  listWorkflows,
  runAuthorAdvise,
  type AuthorAdviseDraft,
  type AuthorAdviseProposal,
  type Workflow,
} from "@/lib/api";
import { dispatchWorkspaceUpdated } from "@/lib/workspace-updated";
import { QuickPceSuggestionDrawer } from "./QuickPceSuggestionDrawer";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";
import { PlusIcon } from "@/components/shared/icons";

const FACTS_MAX = 10_000;
const FACTS_PLACEHOLDER =
  "e.g: Microservices are missing. I split the payment pipeline into services and workers at the Company and connected them with APIs.";

type QuickPceDrawerProps = {
  open: boolean;
  onClose: () => void;
  suggestionOpen: boolean;
  onSuggestionOpenChange: (open: boolean) => void;
};

function formatWorkflowDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function QuickPceDrawer({
  open,
  onClose,
  suggestionOpen,
  onSuggestionOpenChange,
}: QuickPceDrawerProps) {
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [selection, setSelection] = useState<WorkflowSelection>(
    EMPTY_WORKFLOW_SELECTION,
  );
  const [userFacts, setUserFacts] = useState("");
  const [factsError, setFactsError] = useState<string | undefined>();
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(
    null,
  );
  const [advising, setAdvising] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState<AuthorAdviseProposal | null>(null);
  const [workspaceFingerprint, setWorkspaceFingerprint] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState<AuthorAdviseDraft | null>(null);

  const fetchWorkflows = useCallback(() => listWorkflows("", null), []);

  function onWorkflowSelect(id: string, row: Workflow) {
    if (selection.workflowId === id) {
      setSelection(EMPTY_WORKFLOW_SELECTION);
      return;
    }
    setSelection({ workflowId: id, workflowName: row.name });
  }

  function clearWorkflowSelection() {
    setSelection(EMPTY_WORKFLOW_SELECTION);
  }

  async function handleNext() {
    const trimmed = userFacts.trim();
    if (!trimmed) {
      setFactsError("Describe what you need.");
      return;
    }
    if (trimmed.length > FACTS_MAX) {
      setFactsError(`Maximum ${FACTS_MAX.toLocaleString()} characters.`);
      return;
    }
    setFactsError(undefined);
    setAdvising(true);

    const payload = {
      userFacts: trimmed,
      ...(selection.workflowId ? { workflowId: selection.workflowId } : {}),
    };

    const res = await runAuthorAdvise(payload);
    setAdvising(false);

    if (res.error || !res.data) {
      toast(res.error ?? "Quick PCE advisor failed.", "error");
      return;
    }

    setProposal(res.data.proposal);
    setDraft(res.data.proposal.draft);
    setWorkspaceFingerprint(res.data.workspaceFingerprint);
    setTokenUsed(res.data.tokenUsed);
    void refreshTokenUsed();
    onSuggestionOpenChange(true);
    toast("Suggestion ready.", "success");
  }

  async function handleApply() {
    if (!proposal || !workspaceFingerprint || !draft) return;

    setApplying(true);
    const res = await applyAuthorAdvise({
      workspaceFingerprint,
      proposal,
      draft,
      ...(selection.workflowId ? { workflowId: selection.workflowId } : {}),
    });
    setApplying(false);

    if (res.error || !res.data) {
      toast(res.error ?? "Could not apply suggestion.", "error");
      return;
    }

    for (const warning of res.data.warnings) {
      toast(warning, "warning");
    }

    dispatchWorkspaceUpdated({
      workflowId: res.data.appliedWorkflowId,
      experienceId: proposal.target.experienceId ?? proposal.link.experienceId,
      companyId: proposal.target.companyId ?? proposal.link.companyId,
    });

    toast("Workspace updated.", "success");
    setUserFacts("");
    setFactsError(undefined);
    setProposal(null);
    setDraft(null);
    setWorkspaceFingerprint(null);
    onSuggestionOpenChange(false);
  }

  function handleClose() {
    onSuggestionOpenChange(false);
    onClose();
  }

  return (
    <>
      <Drawer
        title="Quick PCE"
        open={open}
        onClose={handleClose}
        zIndex={50}
        closeOnEscape={!suggestionOpen}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">
                  Optional: select one workflow to scope the graph. With no
                  selection, all workflows are included.
                </p>
                {selection.workflowId ? (
                  <button
                    type="button"
                    onClick={clearWorkflowSelection}
                    className="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <PcewSection<Workflow>
                title="Workflow"
                emptyLabel="No workflows found."
                selectionMode="single"
                isSelected={(id) => selection.workflowId === id}
                onRowSelect={onWorkflowSelect}
                fetchAll={fetchWorkflows}
                loadErrorLabel="Failed to load workflows"
                viewing={viewingWorkflow}
                onView={setViewingWorkflow}
                minWidthClass="min-w-[640px]"
                columns={[
                  {
                    header: "Name",
                    cell: (row) => (
                      <span className="font-medium">{row.name}</span>
                    ),
                  },
                  {
                    header: "Description",
                    className: "max-w-[200px] truncate text-muted",
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

              <p className="text-xs text-muted">
                {selection.workflowId
                  ? "Advising for the selected workflow only."
                  : "Advising across all workflows."}
              </p>
            </div>

            <label className="block space-y-1 text-sm">
              <span>
                What do you need?
                <span className="ml-0.5 text-danger" aria-hidden>*</span>
              </span>
              <textarea
                value={userFacts}
                onChange={(event) => {
                  setUserFacts(event.target.value);
                  if (factsError) setFactsError(undefined);
                }}
                rows={6}
                maxLength={FACTS_MAX}
                placeholder={FACTS_PLACEHOLDER}
                aria-invalid={Boolean(factsError)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
              />
              {factsError ? (
                <p className="text-sm text-danger">{factsError}</p>
              ) : null}
            </label>

            <p className="text-xs text-muted">
              No workflows yet?{" "}
              <Link
                href="/workflows/new"
                className="text-foreground underline"
                onClick={handleClose}
              >
                Add a workflow
              </Link>
              .
            </p>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => void handleNext()}
              className="rounded-md bg-accent-fg px-4 py-2 text-sm font-medium text-accent hover:opacity-90"
            >
              {advising ? "Running…" : "Next"}
            </button>
          </div>
        </div>
      </Drawer>

      <QuickPceSuggestionDrawer
        open={suggestionOpen}
        onClose={() => onSuggestionOpenChange(false)}
        proposal={proposal}
        draft={draft}
        onDraftChange={setDraft}
        onApply={() => void handleApply()}
        applying={applying}
      />

      {advising ? (
        <BusyOverlay
          title="Quick PCE"
          description="Finding where to record your facts in the workspace…"
        />
      ) : null}
    </>
  );
}

type QuickPceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFab?: boolean;
};

export function QuickPce({
  open,
  onOpenChange,
  showFab = true,
}: QuickPceProps) {
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  function closeAll() {
    setSuggestionOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      {showFab ? (
        <button
          type="button"
          aria-label="Quick PCE"
          className={STUDIO_FAB_CLASS}
          onClick={() => onOpenChange(!open)}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      ) : null}

      <QuickPceDrawer
        open={open}
        onClose={closeAll}
        suggestionOpen={suggestionOpen}
        onSuggestionOpenChange={setSuggestionOpen}
      />
    </>
  );
}

export { QuickPceDrawer };
