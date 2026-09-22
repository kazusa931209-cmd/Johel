"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCardReadOnly } from "@/components/generate/CombineCompanyCardReadOnly";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { usePce } from "@/lib/pce";
import { resolveProfileGraduation } from "@/lib/profile";

type CombineCompaniesReadOnlySectionProps = {
  combine: CombineSnapshot;
};

export function CombineCompaniesReadOnlySection({
  combine,
}: CombineCompaniesReadOnlySectionProps) {
  const t = useT();
  const { profiles, companies, loading } = usePce();

  const profileGraduation = useMemo(() => {
    const profile = profiles.find((item) => item.id === combine.profileId);
    return profile ? resolveProfileGraduation(profile) : null;
  }, [combine.profileId, profiles]);

  const companyById = useMemo(
    () => new Map(companies.map((item) => [item.id, item])),
    [companies],
  );

  if (loading) {
    return <p className="text-sm text-muted">{t("shared.detail.loading")}</p>;
  }

  return (
    <section className={COMBINE_SECTION_CLASS}>
      <div className="space-y-1">
        <h3 className={COMBINE_SECTION_TITLE_CLASS}>
          {t("generate.combine.companiesAndExperiences")}
        </h3>
        <p className="text-xs text-muted">
          {t("generate.combine.companiesAndExperiencesReadOnlyHint")}
        </p>
      </div>

      {combine.companies.length < 1 ? (
        <p className="text-sm text-muted">{t("generate.previous.combineEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {combine.companies.map((entry, index) => {
            const company = companyById.get(entry.companyId);
            if (!company) {
              return (
                <div
                  key={`${entry.companyId}-${index}`}
                  className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted"
                >
                  {t("generate.previous.combineCompanyMissing")}
                </div>
              );
            }
            return (
              <CombineCompanyCardReadOnly
                key={`${entry.companyId}-${index}`}
                company={company}
                entry={entry}
                profileGraduation={profileGraduation}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
