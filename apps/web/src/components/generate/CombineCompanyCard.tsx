"use client";

import { memo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyContextFields } from "@/components/generate/CombineCompanyContextFields";
import type { CombineCompanyContextFlushResult } from "@/components/generate/CombineCompanyContextFields";
import { CombineCompanyExperienceList } from "@/components/generate/CombineCompanyExperienceList";
import { CombineCompanyPeriodBlock } from "@/components/generate/CombineCompanyPeriodBlock";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import type { CompanyDetail } from "@/lib/api";
import type { ProfileGraduation } from "@/lib/profile";

type CombineCompanyCardProps = {
  company: CompanyDetail;
  included: boolean;
  entry: CombineCompanyEntry | undefined;
  priorStartIndex: number | null;
  profileGraduation: ProfileGraduation | null;
  cardsDisabled: boolean;
  onToggleInclude: (companyId: string, included: boolean) => void;
  onPatchEntry: (
    companyId: string,
    patch: Partial<CombineCompanyEntry>,
  ) => void;
  onPeriodChange: (
    companyId: string,
    period: { startDate: string; endDate: string },
  ) => void;
  onRegisterFlush: (
    flusher: () => CombineCompanyContextFlushResult | null,
  ) => () => void;
  onView: (company: CompanyDetail) => void;
  onSuggest?: () => void;
  suggesting?: boolean;
  suggestDisabled?: boolean;
  rationale?: string;
  onExperienceIdsChange: (companyId: string, experienceIds: string[]) => void;
};

export const CombineCompanyCard = memo(function CombineCompanyCard({
  company,
  included,
  entry,
  priorStartIndex,
  profileGraduation,
  cardsDisabled,
  onToggleInclude,
  onPatchEntry,
  onPeriodChange,
  onRegisterFlush,
  onView,
  onSuggest,
  suggesting = false,
  suggestDisabled = false,
  rationale,
  onExperienceIdsChange,
}: CombineCompanyCardProps) {
  const t = useT();

  return (
    <article className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex min-h-12 items-stretch">
        <div className="flex min-w-0 flex-1 items-center px-4 py-3">
          <label
            className={`inline-flex min-w-0 max-w-full items-center gap-3 ${
              cardsDisabled
                ? "cursor-not-allowed"
                : "cursor-pointer hover:opacity-90"
            }`}
          >
            <input
              type="checkbox"
              checked={included}
              disabled={cardsDisabled}
              onChange={(event) =>
                onToggleInclude(company.id, event.target.checked)
              }
              className="h-4 w-4 shrink-0 rounded border-border disabled:cursor-not-allowed"
            />
            <span className="min-w-0 font-medium">{company.name}</span>
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2 px-3">
          {included && onSuggest ? (
            <button
              type="button"
              onClick={onSuggest}
              disabled={suggestDisabled || suggesting}
              aria-label={t("generate.combine.suggestCompanyAria", {
                name: company.name,
              })}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
            >
              {suggesting
                ? t("generate.combine.suggesting")
                : t("crud.experiences.advisor.suggest")}
            </button>
          ) : null}
          <ViewButton onClick={() => onView(company)} />
        </div>
      </div>

      {included && entry && profileGraduation != null ? (
        <div className="space-y-4 border-t border-border p-4">
          <CombineCompanyPeriodBlock
            companyId={company.id}
            startDate={entry.startDate}
            endDate={entry.endDate}
            priorStartIndex={priorStartIndex}
            profileGraduation={profileGraduation}
            onPeriodChange={onPeriodChange}
          />

          <CombineCompanyContextFields
            companyId={company.id}
            roleContext={entry.roleContext}
            keywordContext={entry.keywordContext}
            cardsDisabled={cardsDisabled}
            onPatchEntry={onPatchEntry}
            onRegisterFlush={onRegisterFlush}
          />

          <CombineCompanyExperienceList
            experienceIds={entry.experienceIds}
            rationale={rationale}
            disabled={cardsDisabled}
            onChange={(experienceIds) =>
              onExperienceIdsChange(company.id, experienceIds)
            }
          />
        </div>
      ) : null}
    </article>
  );
});
