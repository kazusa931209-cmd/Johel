"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { Drawer } from "@/components/shared/drawer";
import type { AuthorAdviseDraft, AuthorAdviseProposal } from "@/lib/api";
import { loadSuggestionWhereLines } from "./quick-experience-suggestion-target";

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

type QuickExperienceSuggestionDrawerProps = {
  open: boolean;
  onClose: () => void;
  proposal: AuthorAdviseProposal | null;
  draft: AuthorAdviseDraft | null;
  onDraftChange: (draft: AuthorAdviseDraft) => void;
  onApply: () => void;
  applying: boolean;
};

export function QuickExperienceSuggestionDrawer({
  open,
  onClose,
  proposal,
  draft,
  onDraftChange,
  onApply,
  applying,
}: QuickExperienceSuggestionDrawerProps) {
  const t = useT();
  const [whereLines, setWhereLines] = useState<string[]>([]);
  const [whereLoading, setWhereLoading] = useState(false);

  const placementLabels = useMemo(
    () => ({
      create_experience: t("quickExperience.suggestion.placements.createExperience"),
      update_experience: t("quickExperience.suggestion.placements.updateExperience"),
      link_existing: t("quickExperience.suggestion.placements.linkExisting"),
      update_company: t("quickExperience.suggestion.placements.updateCompany"),
      update_role_context: t("quickExperience.suggestion.placements.updateRoleContext"),
      update_workflow_description: t(
        "quickExperience.suggestion.placements.updateWorkflowDescription",
      ),
      need_more_facts: t("quickExperience.suggestion.placements.needMoreFacts"),
    }),
    [t],
  );

  useEffect(() => {
    if (!open || !proposal || proposal.placement === "need_more_facts") {
      setWhereLines([]);
      setWhereLoading(false);
      return;
    }

    let cancelled = false;
    setWhereLoading(true);
    void loadSuggestionWhereLines(proposal, draft).then((lines) => {
      if (cancelled) return;
      setWhereLines(lines);
      setWhereLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, proposal, draft]);

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
      title={t("quickExperience.suggestion.title")}
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
              {t("quickExperience.suggestion.placement")}
            </p>
            <p className="mt-1 font-medium">
              {placementLabels[proposal.placement]}
            </p>
          </div>

          {proposal.placement !== "need_more_facts" ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("quickExperience.suggestion.where")}
              </p>
              {whereLoading ? (
                <p className="mt-1 text-muted">
                  {t("quickExperience.suggestion.loadingTarget")}
                </p>
              ) : whereLines.length > 0 ? (
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {whereLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted">{t("crud.common.emDash")}</p>
              )}
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("quickExperience.suggestion.rationale")}
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
                {t("quickExperience.suggestion.questions")}
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
                label={t("quickExperience.suggestion.fields.category")}
                value={draft.category ?? ""}
                onChange={(value) => patchDraft({ category: value })}
                rows={2}
              />
              <DraftField
                label={t("quickExperience.suggestion.fields.problem")}
                value={draft.problem ?? ""}
                onChange={(value) => patchDraft({ problem: value })}
              />
              <DraftField
                label={t("quickExperience.suggestion.fields.actions")}
                value={draft.actions ?? ""}
                onChange={(value) => patchDraft({ actions: value })}
              />
              <DraftField
                label={t("quickExperience.suggestion.fields.outcome")}
                value={draft.outcome ?? ""}
                onChange={(value) => patchDraft({ outcome: value })}
              />
            </div>
          ) : null}

          {proposal.placement === "update_company" ? (
            <div className="space-y-3">
              <DraftField
                label={t("quickExperience.suggestion.fields.whatCompanyIs")}
                value={draft.whatCompanyIs ?? ""}
                onChange={(value) => patchDraft({ whatCompanyIs: value })}
              />
              <DraftField
                label={t("quickExperience.suggestion.fields.domainAndStack")}
                value={draft.domainAndStack ?? ""}
                onChange={(value) => patchDraft({ domainAndStack: value })}
              />
            </div>
          ) : null}

          {proposal.placement === "update_role_context" ? (
            <DraftField
              label={t("quickExperience.suggestion.fields.roleContext")}
              value={draft.roleContext ?? ""}
              onChange={(value) => patchDraft({ roleContext: value })}
              rows={3}
            />
          ) : null}

          {proposal.placement === "update_workflow_description" ? (
            <DraftField
              label={t("quickExperience.suggestion.fields.workflowDescription")}
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
              {applying
                ? t("quickExperience.suggestion.applying")
                : t("quickExperience.suggestion.apply")}
            </button>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
