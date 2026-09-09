"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import type { ExperienceAdviseResult } from "@/lib/api";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatExperienceSuggestionCopyText } from "@/lib/format-experience-suggestion-copy";

type ExperienceSuggestionReferencePanelProps = {
  result: ExperienceAdviseResult;
};

export function ExperienceSuggestionReferencePanel({
  result,
}: ExperienceSuggestionReferencePanelProps) {
  const t = useT();
  const { toast } = useToast();

  const copyText = useMemo(
    () =>
      formatExperienceSuggestionCopyText(result, [], {
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
    [result, t],
  );

  async function handleCopy() {
    const ok = await copyTextToClipboard(copyText);
    if (ok) {
      toast(t("toast.copied"), "success");
    } else {
      toast(t("toast.copyFailed"), "error");
    }
  }

  const warnings = result.operations.flatMap((op) => op.warnings);

  return (
    <section
      aria-labelledby="experience-suggestion-reference-title"
      className="space-y-3 rounded-md border border-border bg-muted/20 p-4"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <h2
          id="experience-suggestion-reference-title"
          className="text-sm font-semibold"
        >
          {t("crud.experiences.advisor.suggestionTitle")}
        </h2>
        <CopyButton
          disabled={!copyText.trim()}
          onClick={() => void handleCopy()}
        />
      </div>

      <div className="select-text space-y-3 text-sm">
        {result.rationale.trim() ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("crud.experiences.advisor.rationale")}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{result.rationale}</p>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("crud.experiences.advisor.warnings")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-toast-warning-fg">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.questions.length > 0 ? (
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
      </div>
    </section>
  );
}
