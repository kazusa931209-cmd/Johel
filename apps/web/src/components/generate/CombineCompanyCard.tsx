"use client";

import { memo } from "react";
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
  rationale,
  onExperienceIdsChange,
}: CombineCompanyCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex items-stretch">
        <label
          className={`flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 py-3 ${
            cardsDisabled
              ? "cursor-not-allowed"
              : "cursor-pointer hover:bg-surface-muted/60"
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
          <span className="min-w-0 flex-1 font-medium">{company.name}</span>
        </label>
        <div className="pointer-events-auto flex items-center px-3">
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
