"use client";

import { memo, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { CombineCompanyContextFieldsReadOnly } from "@/components/generate/CombineCompanyContextFieldsReadOnly";
import { CombineCompanyExperienceList } from "@/components/generate/CombineCompanyExperienceList";
import { CombinePeriodDisplay } from "@/components/generate/CombinePeriodDisplay";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import type { CompanyDetail } from "@/lib/api";
import type { ProfileGraduation } from "@/lib/profile";

type CombineCompanyCardReadOnlyProps = {
  company: CompanyDetail;
  entry: CombineCompanyEntry;
  profileGraduation: ProfileGraduation | null;
};

export const CombineCompanyCardReadOnly = memo(function CombineCompanyCardReadOnly({
  company,
  entry,
  profileGraduation,
}: CombineCompanyCardReadOnlyProps) {
  const t = useT();
  const [viewCompanyOpen, setViewCompanyOpen] = useState(false);

  return (
    <>
      <article className="overflow-hidden rounded-md border border-border bg-background">
        <div className="flex min-h-12 items-stretch">
          <div className="flex min-w-0 flex-1 items-center px-4 py-3">
            <span className="min-w-0 font-medium">{company.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 px-3">
            <ViewButton onClick={() => setViewCompanyOpen(true)} />
          </div>
        </div>

        <div className="space-y-4 border-t border-border p-4">
          <div className="flex items-start gap-3 text-sm">
            <span className="w-36 shrink-0 pt-0.5">
              {t("generate.combine.period")}
            </span>
            <p className="min-w-0 flex-1 text-muted [&_span]:text-muted">
              <CombinePeriodDisplay
                startDate={entry.startDate}
                endDate={entry.endDate}
                profileGraduation={profileGraduation}
                className="text-sm font-normal"
              />
            </p>
          </div>

          <CombineCompanyContextFieldsReadOnly
            roleContext={entry.roleContext}
            keywordContext={entry.keywordContext}
          />

          <CombineCompanyExperienceList
            experienceIds={entry.experienceIds}
            readOnly
            onChange={() => {}}
          />
        </div>
      </article>

      {viewCompanyOpen ? (
        <CompanyDetailDialog
          company={company}
          onClose={() => setViewCompanyOpen(false)}
        />
      ) : null}
    </>
  );
});
