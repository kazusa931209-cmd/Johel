"use client";

import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { ExperienceSuggestionContent } from "@/components/ExperienceSuggestionContent";
import { Drawer } from "@/components/shared/drawer";
import type { ExperienceDetail, ExperienceSplitResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

type ExperienceSplitDrawerProps = {
  open: boolean;
  experience: ExperienceDetail | null;
  onClose: () => void;
  result: ExperienceSplitResult | null;
  adviseShapedResult: {
    rationale: string;
    questions: string[];
    operations: Array<{
      placement: "create_experience";
      rationale: string;
      targetExperienceId: null;
      draft: ExperienceSplitResult["operations"][number]["draft"];
      warnings: string[];
    }>;
  } | null;
  displayOperations: ExperienceAdviseDisplayOperation[];
  onSuggest: () => void;
  onApply: () => void;
  suggesting: boolean;
  applying: boolean;
};

export function ExperienceSplitDrawer({
  open,
  experience,
  onClose,
  result,
  adviseShapedResult,
  displayOperations,
  onSuggest,
  onApply,
  suggesting,
  applying,
}: ExperienceSplitDrawerProps) {
  const t = useT();
  const actionable = displayOperations.length > 0;
  const showSuggestion = result != null && adviseShapedResult != null;

  return (
    <Drawer
      title={t("crud.experiences.split.drawerTitle")}
      open={open}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
      footer={
        showSuggestion && actionable ? (
          <button
            type="button"
            onClick={onApply}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {applying
              ? t("crud.experiences.split.applying")
              : t("crud.experiences.split.apply")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSuggest}
            disabled={suggesting || !experience}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {suggesting
              ? t("crud.experiences.split.suggesting")
              : t("crud.experiences.split.suggest")}
          </button>
        )
      }
    >
      <div className="space-y-4 p-4">
        {experience ? (
          <div className="space-y-3 rounded-md border border-border bg-surface-muted/30 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("crud.experiences.split.sourceCard")}
            </p>
            <p className="font-medium">{experience.category}</p>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("crud.experiences.columns.problem")}
              </p>
              <AiVerdictMarkdown markdown={experience.problem} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("crud.experiences.columns.actions")}
              </p>
              <AiVerdictMarkdown markdown={experience.actions} />
            </div>
            {experience.outcome.trim() ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("crud.experiences.columns.outcome")}
                </p>
                <AiVerdictMarkdown markdown={experience.outcome} />
              </div>
            ) : null}
          </div>
        ) : null}

        {showSuggestion && adviseShapedResult ? (
          <ExperienceSuggestionContent
            result={adviseShapedResult}
            displayOperations={displayOperations}
            onApply={onApply}
            applying={applying}
            showApplyButton={false}
          />
        ) : null}
      </div>
    </Drawer>
  );
}
