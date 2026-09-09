"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { EXPERIENCE_FACTS_MAX } from "@/lib/use-experience-advise-flow";

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

type ExperienceFactFormFieldsProps = {
  userFacts: string;
  onUserFactsChange: (value: string) => void;
  factsError?: string;
  onSuggest: () => void;
  advising: boolean;
  editingCategory?: string;
  referencePanel?: ReactNode;
  /** When false, parent renders Suggest in a drawer footer. Default true. */
  showSuggestButton?: boolean;
};

export function ExperienceFactFormFields({
  userFacts,
  onUserFactsChange,
  factsError,
  onSuggest,
  advising,
  editingCategory,
  referencePanel,
  showSuggestButton = true,
}: ExperienceFactFormFieldsProps) {
  const t = useT();

  return (
    <div className="space-y-6">
      {editingCategory ? (
        <p className="text-sm text-muted">
          {t("crud.experiences.advisor.editingCard", {
            category: editingCategory,
          })}
        </p>
      ) : null}

      <p className="text-sm text-muted">
        {t("crud.experiences.advisor.description")}
      </p>

      {referencePanel}

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.experiences.advisor.factsLabel")}
          <RequiredMark />
        </span>
        <textarea
          value={userFacts}
          onChange={(event) => onUserFactsChange(event.target.value)}
          rows={24}
          maxLength={EXPERIENCE_FACTS_MAX}
          placeholder={t("crud.experiences.advisor.factsPlaceholder")}
          aria-invalid={Boolean(factsError)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
        {factsError ? (
          <p className="text-sm text-danger">{factsError}</p>
        ) : null}
      </label>

      {showSuggestButton ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSuggest}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {advising
              ? t("crud.experiences.advisor.running")
              : t("crud.experiences.advisor.suggest")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
