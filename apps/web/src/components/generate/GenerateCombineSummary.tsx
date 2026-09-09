"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import {
  formatCompanyPeriod,
  RUN_LANGUAGES,
  type CombineSnapshot,
} from "@/components/generate/combine-types";
import { listCompanies, listProfiles } from "@/lib/api";
import { fullName } from "@/lib/profile";

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
  const [profileName, setProfileName] = useState<string | null>(null);
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listProfiles("", null), listCompanies("", null)]).then(
      ([profilesRes, companiesRes]) => {
        if (cancelled) return;

        const profile = (profilesRes.data?.items ?? []).find(
          (item) => item.id === combine.profileId,
        );
        setProfileName(
          profile ? fullName(profile.firstName, profile.lastName) : null,
        );
        setCompanyNameById(
          new Map(
            (companiesRes.data?.items ?? []).map((item) => [item.id, item.name]),
          ),
        );
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [combine.profileId]);

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

      {combine.emphasis.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">{t("generate.combine.emphasis")}</dt>
          <dd className="whitespace-pre-wrap font-mono text-muted">
            {combine.emphasis}
          </dd>
        </div>
      ) : null}

      <div className="space-y-2">
        <dt className="font-medium">{t("generate.combine.companies")}</dt>
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
              </div>
            ))
          )}
        </dd>
      </div>
    </dl>
  );
}
