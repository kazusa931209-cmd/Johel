"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { CombineCompanyCard } from "@/components/generate/CombineCompanyCard";
import type { CombineCompanyContextFlushResult } from "@/components/generate/CombineCompanyContextFields";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import {
  buildPeriodWindow,
  clampPeriodToWindow,
  defaultChainedPeriodIndices,
  defaultPeriodIndices,
  indicesToPeriod,
  labelsToMonthIndices,
} from "@/lib/combine-period";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
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
  onRegisterContextFlush?: (flush: () => void) => void;
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
  onRegisterContextFlush,
}: CombineCompanyCardsProps) {
  const t = useT();
  const { locale } = useLocale();
  const { companies: workspaceCompanies, loading } = usePce();
  const [viewCompany, setViewCompany] = useState<CompanyDetail | null>(null);
  const contextFlushersRef = useRef(
    new Set<() => CombineCompanyContextFlushResult | null>(),
  );

  const companiesRef = useRef(companies);
  companiesRef.current = companies;

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
  const includedById = useMemo(
    () => new Map(companies.map((entry) => [entry.companyId, entry])),
    [companies],
  );
  const priorStartIndexByCompanyId = useMemo(() => {
    const indices = new Map<string, number | null>();
    if (!periodWindow) return indices;

    for (let index = 0; index < companies.length; index += 1) {
      const entry = companies[index];
      const priorEntry = index > 0 ? companies[index - 1] : null;
      indices.set(
        entry.companyId,
        priorEntry
          ? labelsToMonthIndices(
              periodWindow,
              priorEntry.startDate,
              priorEntry.endDate,
              locale,
            ).startIndex
          : null,
      );
    }
    return indices;
  }, [companies, locale, periodWindow]);

  const updateIncluded = useCallback(
    (nextEntries: CombineCompanyEntry[]) => {
      const normalized = normalizeIncludedEntries(workspaceIdSet, nextEntries);
      companiesRef.current = normalized;
      onClearError?.();
      onChange(normalized);
    },
    [onChange, onClearError, workspaceIdSet],
  );

  const patchEntry = useCallback(
    (companyId: string, patch: Partial<CombineCompanyEntry>) => {
      updateIncluded(
        companiesRef.current.map((entry) =>
          entry.companyId === companyId ? { ...entry, ...patch } : entry,
        ),
      );
    },
    [updateIncluded],
  );

  const onPeriodChange = useCallback(
    (
      companyId: string,
      period: { startDate: string; endDate: string },
    ) => {
      patchEntry(companyId, period);
    },
    [patchEntry],
  );

  const registerContextFlush = useCallback(
    (flusher: () => CombineCompanyContextFlushResult | null) => {
      contextFlushersRef.current.add(flusher);
      return () => {
        contextFlushersRef.current.delete(flusher);
      };
    },
    [],
  );

  const flushPendingContext = useCallback(() => {
    const patches = [...contextFlushersRef.current]
      .map((flusher) => flusher())
      .filter((result): result is CombineCompanyContextFlushResult => result != null);
    if (patches.length === 0) {
      return;
    }

    const patchByCompanyId = new Map(
      patches.map((result) => [result.companyId, result.patch]),
    );
    updateIncluded(
      companiesRef.current.map((entry) => {
        const patch = patchByCompanyId.get(entry.companyId);
        return patch ? { ...entry, ...patch } : entry;
      }),
    );
  }, [updateIncluded]);

  useEffect(() => {
    onRegisterContextFlush?.(flushPendingContext);
  }, [flushPendingContext, onRegisterContextFlush]);

  const toggleInclude = useCallback(
    (companyId: string, included: boolean) => {
      if (cardsDisabled || !periodWindow) return;

      const currentCompanies = companiesRef.current;

      if (!included) {
        updateIncluded(
          currentCompanies.filter((entry) => entry.companyId !== companyId),
        );
        return;
      }

      const includedByIdLocal = new Map(
        currentCompanies.map((entry) => [entry.companyId, entry]),
      );
      const existing = includedByIdLocal.get(companyId);
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
      } else if (currentCompanies.length > 0) {
        const priorEntry = currentCompanies[currentCompanies.length - 1];
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
        ...currentCompanies.filter((entry) => entry.companyId !== companyId),
        {
          companyId,
          startDate: restoredPeriod.startDate,
          endDate: restoredPeriod.endDate,
          roleContext: existing?.roleContext ?? "",
          keywordContext: existing?.keywordContext ?? "",
          experienceIds: existing?.experienceIds ?? [],
        },
      ]);
    },
    [cardsDisabled, locale, periodWindow, updateIncluded],
  );

  const resetCompanies = useCallback(() => {
    if (companiesRef.current.length === 0) return;
    updateIncluded([]);
  }, [updateIncluded]);

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

          return (
            <CombineCompanyCard
              key={company.id}
              company={company}
              included={included}
              entry={entry}
              priorStartIndex={
                included
                  ? (priorStartIndexByCompanyId.get(company.id) ?? null)
                  : null
              }
              profileGraduation={profileGraduation}
              cardsDisabled={cardsDisabled}
              onToggleInclude={toggleInclude}
              onPatchEntry={patchEntry}
              onPeriodChange={onPeriodChange}
              onRegisterFlush={registerContextFlush}
              onView={setViewCompany}
            />
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
