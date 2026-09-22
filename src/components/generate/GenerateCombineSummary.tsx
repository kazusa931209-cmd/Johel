"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import {
  formatCompanyPeriod,
  RUN_LANGUAGES,
  type CombineSnapshot,
} from "@/components/generate/combine-types";
import { fullName } from "@/lib/profile";
import { usePce } from "@/lib/pce";

type GenerateCombineSummaryProps = {
  combine: CombineSnapshot;
};

function languageLabel(language: string): string {
  return (
    RUN_LANGUAGES.find((option) => option.value === language)?.label ?? language
  );
}

export function GenerateCombineSummary({
  combine,
}: GenerateCombineSummaryProps) {
  const t = useT();
  const { profiles, companies, experiences, loading } = usePce();

  const profileName = useMemo(() => {
    const profile = profiles.find((item) => item.id === combine.profileId);
    return profile ? fullName(profile.firstName, profile.lastName) : null;
  }, [combine.profileId, profiles]);

  const companyNameById = useMemo(
    () => new Map(companies.map((item) => [item.id, item.name])),
    [companies],
  );

  const categoryById = useMemo(
    () => new Map(experiences.map((item) => [item.id, item.category])),
    [experiences],
  );

  if (loading) {
    return <p className="text-sm text-muted">{t("shared.detail.loading")}</p>;
  }

  return (
    <dl className="space-y-4 text-sm">
      <div className="space-y-1">
        <dt className="font-medium">{t("generate.combine.profile")}</dt>
        <dd className="text-muted">
          {profileName ?? t("generate.previous.combineProfileMissing")}
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="font-medium">{t("generate.combine.language")}</dt>
        <dd className="text-muted">{languageLabel(combine.language)}</dd>
      </div>

      {combine.platform.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">
            {t("resumeBuilder.combine.platformLabel")}
          </dt>
          <dd className="font-mono text-muted">{combine.platform}</dd>
        </div>
      ) : null}

      {combine.userInstruction.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">
            {t("resumeBuilder.combine.userInstructionFieldLabel")}
          </dt>
          <dd className="whitespace-pre-wrap font-mono text-muted">
            {combine.userInstruction}
          </dd>
        </div>
      ) : null}

      {combine.emphasis.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">{t("generate.combine.emphasis")}</dt>
          <dd className="whitespace-pre-wrap font-mono text-muted">
            {combine.emphasis}
          </dd>
        </div>
      ) : null}

      <div className="space-y-2">
        <dt className="font-medium">
          {t("generate.combine.companiesAndExperiences")}
        </dt>
        <dd className="space-y-3">
          {combine.companies.length < 1 ? (
            <p className="text-muted">{t("generate.previous.combineEmpty")}</p>
          ) : (
            combine.companies.map((entry, index) => (
              <div
                key={`${entry.companyId}-${index}`}
                className="rounded-md border border-border bg-background px-3 py-3"
              >
                <p className="font-medium">
                  {companyNameById.get(entry.companyId) ??
                    t("generate.previous.combineCompanyMissing")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatCompanyPeriod(entry.startDate, entry.endDate)}
                </p>
                {entry.roleContext.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-muted">
                    {entry.roleContext}
                  </p>
                ) : null}
                {entry.keywordContext.trim() ? (
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium">
                      {t("generate.combine.keywordContext")}:{" "}
                    </span>
                    {entry.keywordContext}
                  </p>
                ) : null}
                {entry.experienceIds.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted">
                      {t("generate.combine.linkedExperiences")}
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                      {entry.experienceIds.map((id) => (
                        <li key={id}>
                          {categoryById.get(id) ?? id}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </dd>
      </div>
    </dl>
  );
}
