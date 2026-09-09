"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { CombinePeriodSlider } from "@/components/generate/CombinePeriodSlider";
import {
  defaultPeriodIndices,
  indicesToPeriod,
} from "@/lib/combine-period";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import { listCompanies, type CompanyDetail } from "@/lib/api";

type CombineCompanyCardsProps = {
  companies: CombineCompanyEntry[];
  onChange: (companies: CombineCompanyEntry[]) => void;
  error?: string;
  onClearError?: () => void;
};

function syncIncludedOrder(
  workspaceIds: string[],
  entries: CombineCompanyEntry[],
): CombineCompanyEntry[] {
  const byId = new Map(entries.map((entry) => [entry.companyId, entry]));
  return workspaceIds
    .map((id) => byId.get(id))
    .filter((entry): entry is CombineCompanyEntry => Boolean(entry));
}

export function CombineCompanyCards({
  companies,
  onChange,
  error,
  onClearError,
}: CombineCompanyCardsProps) {
  const t = useT();
  const { locale } = useLocale();
  const [workspaceCompanies, setWorkspaceCompanies] = useState<CompanyDetail[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [viewCompany, setViewCompany] = useState<CompanyDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCompanies("", null).then((res) => {
      if (cancelled) return;
      setWorkspaceCompanies(res.data?.items ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const workspaceIds = workspaceCompanies.map((company) => company.id);
  const includedById = new Map(
    companies.map((entry) => [entry.companyId, entry]),
  );

  function updateIncluded(nextEntries: CombineCompanyEntry[]) {
    onClearError?.();
    onChange(syncIncludedOrder(workspaceIds, nextEntries));
  }

  function toggleInclude(companyId: string, included: boolean) {
    if (!included) {
      updateIncluded(companies.filter((entry) => entry.companyId !== companyId));
      return;
    }

    const existing = includedById.get(companyId);
    const defaults = defaultPeriodIndices();
    const defaultPeriod = indicesToPeriod(
      defaults.startIndex,
      defaults.endIndex,
      locale,
    );
    updateIncluded([
      ...companies.filter((entry) => entry.companyId !== companyId),
      existing ?? {
        companyId,
        startDate: defaultPeriod.startDate,
        endDate: defaultPeriod.endDate,
        roleContext: "",
        experienceIds: [],
      },
    ]);
  }

  function patchEntry(
    companyId: string,
    patch: Partial<CombineCompanyEntry>,
  ) {
    updateIncluded(
      companies.map((entry) =>
        entry.companyId === companyId ? { ...entry, ...patch } : entry,
      ),
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">{t("shared.detail.loading")}</p>;
  }

  if (workspaceCompanies.length < 1) {
    return (
      <p className="text-sm text-muted">{t("generate.combine.noCompanies")}</p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{t("generate.combine.companies")}</h3>
        <p className="text-xs text-muted">{t("generate.combine.companiesHint")}</p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-4">
        {workspaceCompanies.map((company) => {
          const included = includedById.has(company.id);
          const entry = includedById.get(company.id);

          return (
            <article
              key={company.id}
              className="space-y-4 rounded-md border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sm hover:bg-surface-muted/60">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={(event) =>
                      toggleInclude(company.id, event.target.checked)
                    }
                    className="h-4 w-4 shrink-0 rounded border-border"
                  />
                  <span className="min-w-0 flex-1 font-medium">{company.name}</span>
                </label>
                <ViewButton onClick={() => setViewCompany(company)} />
              </div>

              {included && entry ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted">
                      {t("generate.combine.period")}
                    </span>
                    <CombinePeriodSlider
                      startDate={entry.startDate}
                      endDate={entry.endDate}
                      onChange={(period) =>
                        patchEntry(company.id, period)
                      }
                    />
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span>
                      {t("generate.combine.roleContext")}
                      <span className="ml-0.5 text-danger" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      type="text"
                      value={entry.roleContext}
                      onChange={(event) =>
                        patchEntry(company.id, {
                          roleContext: event.target.value,
                        })
                      }
                      placeholder={t("generate.combine.roleContextPlaceholder")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
                    />
                  </label>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {viewCompany ? (
        <CompanyDetailDialog
          company={viewCompany}
          onClose={() => setViewCompany(null)}
        />
      ) : null}
    </section>
  );
}
