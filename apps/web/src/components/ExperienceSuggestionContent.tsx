"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatExperienceSuggestionCopyText } from "@/lib/format-experience-suggestion-copy";

type ExperienceSuggestionContentProps = {
  result: ExperienceAdviseResult;
  displayOperations: ExperienceAdviseDisplayOperation[];
  onApply: () => void;
  applying: boolean;
};

export function ExperienceSuggestionContent({
  result,
  displayOperations,
  onApply,
  applying,
}: ExperienceSuggestionContentProps) {
  const t = useT();
  const { toast } = useToast();

  const copyText = useMemo(
    () =>
      formatExperienceSuggestionCopyText(result, displayOperations, {
        rationale: t("crud.experiences.advisor.rationale"),
        questions: t("crud.experiences.advisor.questions"),
        create: t("crud.experiences.advisor.placements.create"),
        update: t("crud.experiences.advisor.placements.update"),
        category: t("crud.experiences.form.category"),
        problem: t("crud.experiences.form.problem"),
        actions: t("crud.experiences.form.actions"),
        outcome: t("crud.experiences.form.outcome"),
        warnings: t("crud.experiences.advisor.warnings"),
      }),
    [displayOperations, result, t],
  );

  async function handleCopy() {
    const ok = await copyTextToClipboard(copyText);
    if (ok) {
      toast(t("toast.copied"), "success");
    } else {
      toast(t("toast.copyFailed"), "error");
    }
  }

  const actionable = displayOperations.length > 0;
  const needMoreFacts =
    !actionable &&
    (result.questions.length > 0 ||
      result.operations.some((op) => op.placement === "need_more_facts"));

  return (
    <>
      <div className="mb-4 flex justify-end border-b border-border pb-3">
        <CopyButton
          disabled={!copyText.trim()}
          onClick={() => void handleCopy()}
        />
      </div>
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

        {displayOperations.map((operation, index) => (
          <div
            key={`${operation.placement}-${operation.targetExperienceId ?? "new"}-${index}`}
            className="space-y-3 rounded-md border border-border p-4"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {operation.placement === "create_experience"
                  ? t("crud.experiences.advisor.placements.create")
                  : t("crud.experiences.advisor.placements.update")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{operation.rationale}</p>
            </div>

            {operation.draft.category ? (
              <div>
                <p className="font-medium">{t("crud.experiences.form.category")}</p>
                <p className="mt-1">{operation.draft.category}</p>
              </div>
            ) : null}

            {operation.draft.problem ? (
              <div>
                <p className="font-medium">{t("crud.experiences.form.problem")}</p>
                <AiVerdictMarkdown markdown={operation.draft.problem} />
              </div>
            ) : null}

            {operation.draft.actions ? (
              <div>
                <p className="font-medium">{t("crud.experiences.form.actions")}</p>
                <AiVerdictMarkdown markdown={operation.draft.actions} />
              </div>
            ) : null}

            {operation.draft.outcome ? (
              <div>
                <p className="font-medium">{t("crud.experiences.form.outcome")}</p>
                <AiVerdictMarkdown markdown={operation.draft.outcome} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {actionable ? (
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
