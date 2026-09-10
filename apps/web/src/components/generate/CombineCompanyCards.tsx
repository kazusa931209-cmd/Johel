"use client";

import { useMemo, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import { CombinePeriodDisplay } from "@/components/generate/CombinePeriodDisplay";
import { CombinePeriodSlider } from "@/components/generate/CombinePeriodSlider";
import {
  buildPeriodWindow,
  clampPeriodToWindow,
  defaultChainedPeriodIndices,
  defaultPeriodIndices,
  indicesToPeriod,
  labelsToMonthIndices,
} from "@/lib/combine-period";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import type { CompanyDetail } from "@/lib/api";
import { orderCompaniesForCombineDisplay } from "@/lib/company";
import { usePce } from "@/lib/pce";
import type { ProfileGraduation } from "@/lib/profile";

type CombineCompanyCardsProps = {
  companies: CombineCompanyEntry[];
  onChange: (companies: CombineCompanyEntry[]) => void;
  disabled?: boolean;
  profileGraduation?: ProfileGraduation | null;
  error?: string;
  onClearError?: () => void;
};

function normalizeIncludedEntries(
  workspaceIds: Set<string>,
  entries: CombineCompanyEntry[],
): CombineCompanyEntry[] {
  return entries.filter((entry) => workspaceIds.has(entry.companyId));
}

export function CombineCompanyCards({
  companies,
  onChange,
  disabled = false,
  profileGraduation = null,
  error,
  onClearError,
}: CombineCompanyCardsProps) {
  const t = useT();
  const { locale } = useLocale();
  const { companies: workspaceCompanies, loading } = usePce();
  const [viewCompany, setViewCompany] = useState<CompanyDetail | null>(null);

  const cardsDisabled = disabled || profileGraduation == null;
  const periodWindow =
    profileGraduation != null
      ? buildPeriodWindow(profileGraduation.year, profileGraduation.month)
      : null;

  const workspaceIdSet = useMemo(
    () => new Set(workspaceCompanies.map((company) => company.id)),
    [workspaceCompanies],
  );
  const displayCompanies = useMemo(
    () => orderCompaniesForCombineDisplay(workspaceCompanies, companies),
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
    let restoredPeriod = defaultPeriod;
    if (existing != null) {
      restoredPeriod = clampPeriodToWindow(
        periodWindow,
        existing.startDate,
        existing.endDate,
        locale,
      );
    } else if (companies.length > 0) {
      const priorEntry = companies[companies.length - 1];
      const priorStartIndex = labelsToMonthIndices(
        periodWindow,
        priorEntry.startDate,
        priorEntry.endDate,
        locale,
      ).startIndex;
      const chained = defaultChainedPeriodIndices(
        periodWindow,
        priorStartIndex,
      );
      restoredPeriod = indicesToPeriod(
        periodWindow,
        chained.startIndex,
        chained.endIndex,
        locale,
      );
    }

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

  function resetCompanies() {
    if (companies.length === 0) return;
    updateIncluded([]);
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
    : profileGraduation == null
      ? t("generate.combine.profileGraduationMissing")
      : null;

  return (
    <section className={COMBINE_SECTION_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className={COMBINE_SECTION_TITLE_CLASS}>
            {t("generate.combine.companies")}
          </h3>
          <p className="text-xs text-muted">{t("generate.combine.companiesHint")}</p>
          {disabledMessage ? (
            <p className="text-sm text-muted">{disabledMessage}</p>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={resetCompanies}
          disabled={companies.length === 0}
          aria-label={t("generate.combine.resetCompaniesAria")}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40"
        >
          {t("generate.combine.resetCompanies")}
        </button>
      </div>

      <div
        className={`flex flex-col gap-4 ${cardsDisabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {displayCompanies.map((company) => {
          const included = includedById.has(company.id);
          const entry = includedById.get(company.id);
          const selectionIndex = companies.findIndex(
            (item) => item.companyId === company.id,
          );
          const priorEntry =
            selectionIndex > 0 ? companies[selectionIndex - 1] : null;
          const priorStartIndex =
            priorEntry && periodWindow
              ? labelsToMonthIndices(
                  periodWindow,
                  priorEntry.startDate,
                  priorEntry.endDate,
                  locale,
                ).startIndex
              : null;

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

              {included && entry && profileGraduation != null ? (
                <div className="space-y-4 border-t border-border p-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                      <span className="text-sm">
                        {t("generate.combine.period")}
                        <span className="ml-0.5 text-danger" aria-hidden>
                        *
                      </span>
                      </span>
                      <CombinePeriodDisplay
                        startDate={entry.startDate}
                        endDate={entry.endDate}
                        profileGraduation={profileGraduation}
                        className="text-sm font-medium"
                      />
                    </div>
                    <CombinePeriodSlider
                      graduationYear={profileGraduation.year}
                      graduationMonth={profileGraduation.month}
                      startDate={entry.startDate}
                      endDate={entry.endDate}
                      priorStartIndex={priorStartIndex}
                      onChange={(period) =>
                        patchEntry(company.id, period)
                      }
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0">
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
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0">
                      {t("generate.combine.keywordContext")}
                    </span>
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
                      title={t("generate.combine.keywordContextHint")}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
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
