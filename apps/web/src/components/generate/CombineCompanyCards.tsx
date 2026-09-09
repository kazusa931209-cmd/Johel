"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { CombinePeriodSlider } from "@/components/generate/CombinePeriodSlider";
import {
  buildPeriodWindow,
  clampPeriodToWindow,
  defaultPeriodIndices,
  indicesToPeriod,
} from "@/lib/combine-period";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import { listCompanies, listExperiences, type CompanyDetail } from "@/lib/api";

type CombineCompanyCardsProps = {
  companies: CombineCompanyEntry[];
  onChange: (companies: CombineCompanyEntry[]) => void;
  disabled?: boolean;
  graduationYear?: number | null;
  error?: string;
  onClearError?: () => void;
};

function normalizeIncludedEntries(
  workspaceIds: Set<string>,
  entries: CombineCompanyEntry[],
): CombineCompanyEntry[] {
  return entries.filter((entry) => workspaceIds.has(entry.companyId));
}

function orderCompaniesForDisplay(
  workspaceCompanies: CompanyDetail[],
  includedEntries: CombineCompanyEntry[],
): CompanyDetail[] {
  const workspaceById = new Map(
    workspaceCompanies.map((company) => [company.id, company]),
  );
  const includedIds = new Set(
    includedEntries.map((entry) => entry.companyId),
  );

  const included = includedEntries
    .map((entry) => workspaceById.get(entry.companyId))
    .filter((company): company is CompanyDetail => Boolean(company));

  const excluded = workspaceCompanies.filter(
    (company) => !includedIds.has(company.id),
  );

  return [...included, ...excluded];
}

export function CombineCompanyCards({
  companies,
  onChange,
  disabled = false,
  graduationYear = null,
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
  const [categoryById, setCategoryById] = useState<Map<string, string>>(
    new Map(),
  );

  const cardsDisabled = disabled || graduationYear == null;
  const periodWindow =
    graduationYear != null ? buildPeriodWindow(graduationYear) : null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCompanies("", null), listExperiences("", null)]).then(
      ([companiesRes, experiencesRes]) => {
        if (cancelled) return;
        setWorkspaceCompanies(companiesRes.data?.items ?? []);
        setCategoryById(
          new Map(
            (experiencesRes.data?.items ?? []).map((item) => [
              item.id,
              item.category,
            ]),
          ),
        );
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const workspaceIdSet = useMemo(
    () => new Set(workspaceCompanies.map((company) => company.id)),
    [workspaceCompanies],
  );
  const displayCompanies = useMemo(
    () => orderCompaniesForDisplay(workspaceCompanies, companies),
    [workspaceCompanies, companies],
  );
  const includedById = new Map(
    companies.map((entry) => [entry.companyId, entry]),
  );

  function updateIncluded(nextEntries: CombineCompanyEntry[]) {
    onClearError?.();
    onChange(normalizeIncludedEntries(workspaceIdSet, nextEntries));
  }

  function toggleInclude(companyId: string, included: boolean) {
    if (cardsDisabled || !periodWindow) return;

    if (!included) {
      updateIncluded(companies.filter((entry) => entry.companyId !== companyId));
      return;
    }

    const existing = includedById.get(companyId);
    const defaults = defaultPeriodIndices(periodWindow);
    const defaultPeriod = indicesToPeriod(
      periodWindow,
      defaults.startIndex,
      defaults.endIndex,
      locale,
    );
    const restoredPeriod =
      existing != null
        ? clampPeriodToWindow(
            periodWindow,
            existing.startDate,
            existing.endDate,
            locale,
          )
        : defaultPeriod;

    updateIncluded([
      ...companies.filter((entry) => entry.companyId !== companyId),
      {
        companyId,
        startDate: restoredPeriod.startDate,
        endDate: restoredPeriod.endDate,
        roleContext: existing?.roleContext ?? "",
        keywordContext: existing?.keywordContext ?? "",
        experienceIds: existing?.experienceIds ?? [],
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

  const disabledMessage = disabled
    ? t("generate.combine.selectProfileFirst")
    : graduationYear == null
      ? t("generate.combine.profileGraduationYearMissing")
      : null;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{t("generate.combine.companies")}</h3>
        <p className="text-xs text-muted">{t("generate.combine.companiesHint")}</p>
        {disabledMessage ? (
          <p className="text-sm text-muted">{disabledMessage}</p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      <div
        className={`flex flex-col gap-4 ${cardsDisabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {displayCompanies.map((company) => {
          const included = includedById.has(company.id);
          const entry = includedById.get(company.id);

          return (
            <article
              key={company.id}
              className="overflow-hidden rounded-md border border-border bg-background"
            >
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
                      toggleInclude(company.id, event.target.checked)
                    }
                    className="h-4 w-4 shrink-0 rounded border-border disabled:cursor-not-allowed"
                  />
                  <span className="min-w-0 flex-1 font-medium">{company.name}</span>
                </label>
                <div className="pointer-events-auto flex items-center px-3">
                  <ViewButton onClick={() => setViewCompany(company)} />
                </div>
              </div>

              {included && entry && graduationYear != null ? (
                <div className="space-y-4 border-t border-border p-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted">
                      {t("generate.combine.period")}
                    </span>
                    <CombinePeriodSlider
                      graduationYear={graduationYear}
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
                      disabled={cardsDisabled}
                      onChange={(event) =>
                        patchEntry(company.id, {
                          roleContext: event.target.value,
                        })
                      }
                      placeholder={t("generate.combine.roleContextPlaceholder")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span>{t("generate.combine.keywordContext")}</span>
                    <p className="text-xs text-muted">
                      {t("generate.combine.keywordContextHint")}
                    </p>
                    <input
                      type="text"
                      value={entry.keywordContext}
                      disabled={cardsDisabled}
                      onChange={(event) =>
                        patchEntry(company.id, {
                          keywordContext: event.target.value,
                        })
                      }
                      placeholder={t(
                        "generate.combine.keywordContextPlaceholder",
                      )}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
                    />
                  </label>

                  {entry.experienceIds.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted">
                        {t("generate.combine.linkedExperiences")}
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                        {entry.experienceIds.map((id) => (
                          <li key={id}>
                            {categoryById.get(id) ??
                              t("generate.combine.suggestionExperienceMissing")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
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
