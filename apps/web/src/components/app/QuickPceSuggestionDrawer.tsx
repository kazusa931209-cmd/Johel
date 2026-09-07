"use client";

import { Drawer } from "@/components/shared/drawer";
import type { AuthorAdviseDraft, AuthorAdviseProposal } from "@/lib/api";

const PLACEMENT_LABELS: Record<AuthorAdviseProposal["placement"], string> = {
  create_experience: "Create experience",
  update_experience: "Update experience",
  link_existing: "Link existing experience",
  update_company: "Update company",
  update_role_context: "Update role context",
  update_workflow_description: "Update workflow description",
  need_more_facts: "Need more facts",
};

type DraftFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

function DraftField({ label, value, onChange, rows = 4 }: DraftFieldProps) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
      />
    </label>
  );
}

type QuickPceSuggestionDrawerProps = {
  open: boolean;
  onClose: () => void;
  proposal: AuthorAdviseProposal | null;
  draft: AuthorAdviseDraft | null;
  onDraftChange: (draft: AuthorAdviseDraft) => void;
  onApply: () => void;
  applying: boolean;
};

export function QuickPceSuggestionDrawer({
  open,
  onClose,
  proposal,
  draft,
  onDraftChange,
  onApply,
  applying,
}: QuickPceSuggestionDrawerProps) {
  if (!proposal || !draft) {
    return null;
  }

  const canApply = proposal.placement !== "need_more_facts";

  function patchDraft(patch: Partial<AuthorAdviseDraft>) {
    if (!draft) return;
    onDraftChange({
      category: patch.category !== undefined ? patch.category : draft.category,
      problem: patch.problem !== undefined ? patch.problem : draft.problem,
      actions: patch.actions !== undefined ? patch.actions : draft.actions,
      outcome: patch.outcome !== undefined ? patch.outcome : draft.outcome,
      whatCompanyIs:
        patch.whatCompanyIs !== undefined
          ? patch.whatCompanyIs
          : draft.whatCompanyIs,
      domainAndStack:
        patch.domainAndStack !== undefined
          ? patch.domainAndStack
          : draft.domainAndStack,
      roleContext:
        patch.roleContext !== undefined ? patch.roleContext : draft.roleContext,
      workflowDescription:
        patch.workflowDescription !== undefined
          ? patch.workflowDescription
          : draft.workflowDescription,
    });
  }

  return (
    <Drawer
      title="Suggestion"
      open={open}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Placement
            </p>
            <p className="mt-1 font-medium">
              {PLACEMENT_LABELS[proposal.placement]}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Rationale
            </p>
            <p className="mt-1 whitespace-pre-wrap">{proposal.rationale}</p>
          </div>

          {proposal.warnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-toast-warning-fg">
              {proposal.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {proposal.placement === "need_more_facts" ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Questions
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {proposal.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {proposal.placement === "create_experience" ||
          proposal.placement === "update_experience" ? (
            <div className="space-y-3">
              <DraftField
                label="Category"
                value={draft.category ?? ""}
                onChange={(value) => patchDraft({ category: value })}
                rows={2}
              />
              <DraftField
                label="Problem"
                value={draft.problem ?? ""}
                onChange={(value) => patchDraft({ problem: value })}
              />
              <DraftField
                label="Actions"
                value={draft.actions ?? ""}
                onChange={(value) => patchDraft({ actions: value })}
              />
              <DraftField
                label="Outcome"
                value={draft.outcome ?? ""}
                onChange={(value) => patchDraft({ outcome: value })}
              />
            </div>
          ) : null}

          {proposal.placement === "update_company" ? (
            <div className="space-y-3">
              <DraftField
                label="What this company is"
                value={draft.whatCompanyIs ?? ""}
                onChange={(value) => patchDraft({ whatCompanyIs: value })}
              />
              <DraftField
                label="Domain & stack"
                value={draft.domainAndStack ?? ""}
                onChange={(value) => patchDraft({ domainAndStack: value })}
              />
            </div>
          ) : null}

          {proposal.placement === "update_role_context" ? (
            <DraftField
              label="Role context"
              value={draft.roleContext ?? ""}
              onChange={(value) => patchDraft({ roleContext: value })}
              rows={3}
            />
          ) : null}

          {proposal.placement === "update_workflow_description" ? (
            <DraftField
              label="Workflow description"
              value={draft.workflowDescription ?? ""}
              onChange={(value) => patchDraft({ workflowDescription: value })}
              rows={4}
            />
          ) : null}
        </div>

        {canApply ? (
          <div className="flex shrink-0 justify-end border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {applying ? "Applying…" : "Apply"}
            </button>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
