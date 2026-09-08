"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useLocale, useT } from "@/components/app/LocaleProvider";
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
import { QuickExperienceSuggestionDrawer } from "./QuickExperienceSuggestionDrawer";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";
import { PlusIcon } from "@/components/shared/icons";

const FACTS_MAX = 10_000;

type QuickExperienceDrawerProps = {
  open: boolean;
  onClose: () => void;
  suggestionOpen: boolean;
  onSuggestionOpenChange: (open: boolean) => void;
};

function QuickExperienceDrawer({
  open,
  onClose,
  suggestionOpen,
  onSuggestionOpenChange,
}: QuickExperienceDrawerProps) {
  const { toast } = useToast();
  const t = useT();
  const { locale } = useLocale();
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

  function formatWorkflowDate(iso: string) {
    return new Date(iso).toLocaleString(locale);
  }

  async function handleNext() {
    const trimmed = userFacts.trim();
    if (!trimmed) {
      setFactsError(t("validation.factsRequired"));
      return;
    }
    if (trimmed.length > FACTS_MAX) {
      setFactsError(t("validation.factsMaxLength", { max: FACTS_MAX }));
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
      toast(res.error ?? t("toast.advisorFailed"), "error");
      return;
    }

    setProposal(res.data.proposal);
    setDraft(res.data.proposal.draft);
    setWorkspaceFingerprint(res.data.workspaceFingerprint);
    setTokenUsed(res.data.tokenUsed);
    void refreshTokenUsed();
    onSuggestionOpenChange(true);
    toast(t("toast.suggestionReady"), "success");
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
      toast(res.error ?? t("toast.applyFailed"), "error");
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

    toast(t("toast.workspaceUpdated"), "success");
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
        title={t("quickExperience.drawerTitle")}
        open={open}
        onClose={handleClose}
        zIndex={50}
        closeOnEscape={!suggestionOpen}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">{t("quickExperience.scopeHint")}</p>
                {selection.workflowId ? (
                  <button
                    type="button"
                    onClick={clearWorkflowSelection}
                    className="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                  >
                    {t("quickExperience.clear")}
                  </button>
                ) : null}
              </div>

              <PcewSection<Workflow>
                title={t("quickExperience.workflowSection.title")}
                emptyLabel={t("quickExperience.workflowSection.empty")}
                selectionMode="single"
                isSelected={(id) => selection.workflowId === id}
                onRowSelect={onWorkflowSelect}
                fetchAll={fetchWorkflows}
                loadErrorLabel={t("quickExperience.workflowSection.loadError")}
                viewing={viewingWorkflow}
                onView={setViewingWorkflow}
                minWidthClass="min-w-[640px]"
                columns={[
                  {
                    header: t("quickExperience.workflowSection.columns.name"),
                    cell: (row) => (
                      <span className="font-medium">{row.name}</span>
                    ),
                  },
                  {
                    header: t("quickExperience.workflowSection.columns.description"),
                    className: "max-w-[200px] truncate text-muted",
                    cell: (row) => row.description ?? "",
                  },
                  {
                    header: t("quickExperience.workflowSection.columns.updated"),
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
                  ? t("quickExperience.advisingSelected")
                  : t("quickExperience.advisingAll")}
              </p>
            </div>

            <label className="block space-y-1 text-sm">
              <span>
                {t("quickExperience.whatDoYouNeed")}
                <span className="ml-0.5 text-danger" aria-hidden>*</span>
              </span>
              <textarea
                value={userFacts}
                onChange={(event) => {
                  setUserFacts(event.target.value);
                  if (factsError) setFactsError(undefined);
                }}
                rows={16}
                maxLength={FACTS_MAX}
                placeholder={t("quickExperience.factsPlaceholder")}
                aria-invalid={Boolean(factsError)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
              />
              {factsError ? (
                <p className="text-sm text-danger">{factsError}</p>
              ) : null}
            </label>

            <p className="text-xs text-muted">
              {t("quickExperience.noWorkflowsHint")}{" "}
              <Link
                href="/workflows/new"
                className="text-foreground underline"
                onClick={handleClose}
              >
                {t("quickExperience.addWorkflowLink")}
              </Link>
              .
            </p>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => void handleNext()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {advising ? t("quickExperience.running") : t("quickExperience.next")}
            </button>
          </div>
        </div>
      </Drawer>

      <QuickExperienceSuggestionDrawer
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
          title={t("quickExperience.busy.title")}
          description={t("quickExperience.busy.description")}
        />
      ) : null}
    </>
  );
}

type QuickExperienceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFab?: boolean;
};

export function QuickExperience({
  open,
  onOpenChange,
  showFab = true,
}: QuickExperienceProps) {
  const t = useT();
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
          aria-label={t("quickExperience.fabAria")}
          className={STUDIO_FAB_CLASS}
          onClick={() => onOpenChange(!open)}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      ) : null}

      <QuickExperienceDrawer
        open={open}
        onClose={closeAll}
        suggestionOpen={suggestionOpen}
        onSuggestionOpenChange={setSuggestionOpen}
      />
    </>
  );
}

export { QuickExperienceDrawer };
