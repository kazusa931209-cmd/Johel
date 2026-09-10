"use client";

import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { ExperienceSuggestionUpdateField } from "@/components/ExperienceSuggestionUpdateField";
import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

type ExperienceSuggestionContentProps = {
  result: ExperienceAdviseResult;
  displayOperations: ExperienceAdviseDisplayOperation[];
  onApply: () => void;
  applying: boolean;
  /** When false, parent renders Apply in a drawer footer. Default true. */
  showApplyButton?: boolean;
};

function CreateField({
  label,
  markdown,
}: {
  label: string;
  markdown: string;
}) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      <AiVerdictMarkdown markdown={markdown} />
    </div>
  );
}

export function ExperienceSuggestionContent({
  result,
  displayOperations,
  onApply,
  applying,
  showApplyButton = true,
}: ExperienceSuggestionContentProps) {
  const t = useT();

  const actionable = displayOperations.length > 0;
  const needMoreFacts =
    !actionable &&
    (result.questions.length > 0 ||
      result.operations.some((op) => op.placement === "need_more_facts"));

  return (
    <>
      <div className="select-text space-y-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("crud.experiences.advisor.rationale")}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{result.rationale}</p>
        </div>

        {result.operations.some((op) => op.warnings.length > 0) ? (
          <ul className="list-disc space-y-1 pl-5 text-toast-warning-fg">
            {result.operations.flatMap((op) =>
              op.warnings.map((warning) => (
                <li key={`${op.rationale}-${warning}`}>{warning}</li>
              )),
            )}
          </ul>
        ) : null}

        {needMoreFacts ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("crud.experiences.advisor.questions")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {displayOperations.map((operation, index) => {
          const isCreate = operation.placement === "create_experience";
          const isUpdate = operation.placement === "update_experience";

          const placementTitle = isCreate
            ? t("crud.experiences.advisor.placements.create")
            : operation.draft.category
              ? t("crud.experiences.advisor.placements.updateWithCategory", {
                  category: operation.draft.category,
                })
              : t("crud.experiences.advisor.placements.update");

          return (
            <article
              key={`${operation.placement}-${operation.targetExperienceId ?? "new"}-${index}`}
              aria-label={placementTitle}
              className="overflow-hidden rounded-md border border-border"
            >
              <header className="border-b border-border bg-toast-info-bg px-4 py-2.5 text-sm font-semibold text-toast-info-fg">
                {placementTitle}
              </header>

              <div className="space-y-3 bg-background p-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t("crud.experiences.advisor.rationale")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{operation.rationale}</p>
                </div>

                {operation.draft.category && isCreate ? (
                  <div>
                    <p className="font-medium">
                      {t("crud.experiences.form.category")}
                    </p>
                    <p className="mt-1">{operation.draft.category}</p>
                  </div>
                ) : null}

                {isCreate ? (
                  <>
                    {operation.draft.problem ? (
                      <CreateField
                        label={t("crud.experiences.form.problem")}
                        markdown={operation.draft.problem}
                      />
                    ) : null}
                    {operation.draft.actions ? (
                      <CreateField
                        label={t("crud.experiences.form.actions")}
                        markdown={operation.draft.actions}
                      />
                    ) : null}
                    {operation.draft.outcome ? (
                      <CreateField
                        label={t("crud.experiences.form.outcome")}
                        markdown={operation.draft.outcome}
                      />
                    ) : null}
                  </>
                ) : null}

                {isUpdate && operation.existingDraft && operation.deltaDraft ? (
                  <div className="space-y-6">
                    <ExperienceSuggestionUpdateField
                      label={t("crud.experiences.form.problem")}
                      existing={operation.existingDraft.problem}
                      delta={operation.deltaDraft.problem}
                      merged={operation.draft.problem}
                    />
                    <ExperienceSuggestionUpdateField
                      label={t("crud.experiences.form.actions")}
                      existing={operation.existingDraft.actions}
                      delta={operation.deltaDraft.actions}
                      merged={operation.draft.actions}
                    />
                    <ExperienceSuggestionUpdateField
                      label={t("crud.experiences.form.outcome")}
                      existing={operation.existingDraft.outcome}
                      delta={operation.deltaDraft.outcome}
                      merged={operation.draft.outcome}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {showApplyButton && actionable ? (
        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onApply}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {applying
              ? t("crud.experiences.advisor.applying")
              : t("crud.experiences.advisor.apply")}
          </button>
        </div>
      ) : null}
    </>
  );
}
