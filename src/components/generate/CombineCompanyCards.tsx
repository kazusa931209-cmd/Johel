"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { CombineCompanyCard } from "@/components/generate/CombineCompanyCard";
import type { CombineCompanyContextFlushResult } from "@/components/generate/CombineCompanyContextFields";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import {
  type CombineCompanyEntry,
  type CombineSnapshot,
  isCombineRunReady,
} from "@/components/generate/combine-types";
import { useCombineExperienceSuggest } from "@/components/generate/useCombineExperienceSuggest";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { CombineSuggestConfirmDialogs } from "@/components/generate/CombineSuggestConfirmDialogs";
import {
  buildPeriodWindow,
  clampPeriodToWindow,
  defaultChainedPeriodIndices,
  defaultPeriodIndices,
  indicesToPeriod,
  labelsToMonthIndices,
} from "@/lib/combine-period";
import type { CompanyDetail } from "@/lib/api";
import { orderCompaniesForCombineDisplay } from "@/lib/company";
import type { GenerateJobState } from "@/lib/generate-session";
import { usePce } from "@/lib/pce";
import type { ProfileGraduation } from "@/lib/profile";

type CombineCompanyCardsProps = {
  combine: CombineSnapshot;
  resolveCombineSnapshot?: () => CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  generationId?: string | null;
  onSaveBeforeSuggest: () => Promise<{ error?: string }>;
  companies: CombineCompanyEntry[];
  onChange: (companies: CombineCompanyEntry[]) => void;
  disabled?: boolean;
  profileGraduation?: ProfileGraduation | null;
  error?: string;
  onClearError?: () => void;
  onRegisterContextFlush?: (flush: () => void) => void;
  suggestVariant?: "jd" | "general";
};

function normalizeIncludedEntries(
  workspaceIds: Set<string>,
  entries: CombineCompanyEntry[],
): CombineCompanyEntry[] {
  return entries.filter((entry) => workspaceIds.has(entry.companyId));
}

export function CombineCompanyCards({
  combine,
  resolveCombineSnapshot,
  onCombineChange,
  job,
  doVerdict,
  generationId,
  onSaveBeforeSuggest,
  companies,
  onChange,
  disabled = false,
  profileGraduation = null,
  error,
  onClearError,
  onRegisterContextFlush,
  suggestVariant = "jd",
}: CombineCompanyCardsProps) {
  const t = useT();
  const { locale } = useLocale();
  const { companies: workspaceCompanies, loading } = usePce();
  const [viewCompany, setViewCompany] = useState<CompanyDetail | null>(null);
  const [suggestConfirmOpen, setSuggestConfirmOpen] = useState(false);
  const [companySuggestConfirmId, setCompanySuggestConfirmId] = useState<
    string | null
  >(null);
  const contextFlushersRef = useRef(
    new Set<() => CombineCompanyContextFlushResult | null>(),
  );

  const companiesRef = useRef(companies);
  companiesRef.current = companies;

  const {
    runSuggest,
    runSuggestForCompany,
    suggesting,
    suggestingCompanyId,
    suggestError,
    fieldErrors: suggestFieldErrors,
    suggestSucceeded,
    rationaleByCompanyId,
    warnings,
    companyNeedsSuggestConfirm,
  } = useCombineExperienceSuggest({
    combine,
    resolveCombineSnapshot,
    onCombineChange,
    job,
    doVerdict,
    profileGraduation,
    generationId,
    onSaveBeforeSuggest,
    suggestVariant,
  });

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

  const onExperienceIdsChange = useCallback(
    (companyId: string, experienceIds: string[]) => {
      patchEntry(companyId, { experienceIds });
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

  const requestSuggest = useCallback(() => {
    if (suggestSucceeded) {
      setSuggestConfirmOpen(true);
      return;
    }
    void runSuggest();
  }, [runSuggest, suggestSucceeded]);

  const confirmSuggest = useCallback(() => {
    setSuggestConfirmOpen(false);
    void runSuggest();
  }, [runSuggest]);

  const requestCompanySuggest = useCallback(
    (companyId: string) => {
      if (companyNeedsSuggestConfirm(companyId)) {
        setCompanySuggestConfirmId(companyId);
        return;
      }
      void runSuggestForCompany(companyId);
    },
    [companyNeedsSuggestConfirm, runSuggestForCompany],
  );

  const confirmCompanySuggest = useCallback(() => {
    if (!companySuggestConfirmId) return;
    const companyId = companySuggestConfirmId;
    setCompanySuggestConfirmId(null);
    void runSuggestForCompany(companyId);
  }, [companySuggestConfirmId, runSuggestForCompany]);

  const companySuggestConfirmName = useMemo(() => {
    if (!companySuggestConfirmId) return "";
    return (
      workspaceCompanies.find((company) => company.id === companySuggestConfirmId)
        ?.name ?? ""
    );
  }, [companySuggestConfirmId, workspaceCompanies]);

  const suggestingCompanyName = useMemo(() => {
    if (!suggestingCompanyId) return null;
    return (
      workspaceCompanies.find((company) => company.id === suggestingCompanyId)
        ?.name ?? null
    );
  }, [suggestingCompanyId, workspaceCompanies]);

  const companiesError = error ?? suggestFieldErrors.companies;
  const runReady = isCombineRunReady(combine, profileGraduation);

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
    <>
      {runReady ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-toast-success-bg px-3 py-2 text-sm text-toast-success-fg"
        >
          {t("generate.combine.suggestRunGuidance")}
        </div>
      ) : null}

      <section className={COMBINE_SECTION_CLASS}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className={COMBINE_SECTION_TITLE_CLASS}>
              {t("generate.combine.companiesAndExperiences")}
            </h3>
            <p className="text-xs text-muted">
              {t("generate.combine.companiesAndExperiencesHint")}
            </p>
            {disabledMessage ? (
              <p className="text-sm text-muted">{disabledMessage}</p>
            ) : null}
            {companiesError ? (
              <p className="text-sm text-danger">{companiesError}</p>
            ) : null}
            {suggestError ? (
              <p className="text-sm text-danger">{suggestError}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={resetCompanies}
              disabled={companies.length === 0}
              aria-label={t("generate.combine.resetCompaniesAria")}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40"
            >
              {t("generate.combine.resetCompanies")}
            </button>
            <button
              type="button"
              onClick={requestSuggest}
              disabled={suggesting || cardsDisabled}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {suggesting
                ? t("generate.combine.suggesting")
                : t("generate.combine.suggestExperiences")}
            </button>
          </div>
        </div>

        {warnings.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-toast-warning-fg">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

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
                onSuggest={() => requestCompanySuggest(company.id)}
                suggesting={suggestingCompanyId === company.id}
                suggestDisabled={suggesting || cardsDisabled}
                rationale={rationaleByCompanyId.get(company.id)}
                onExperienceIdsChange={onExperienceIdsChange}
              />
            );
          })}
        </div>

      </section>

      {viewCompany ? (
        <CompanyDetailDialog
          company={viewCompany}
          onClose={() => setViewCompany(null)}
        />
      ) : null}

      {suggesting ? (
        <BusyOverlay
          title={t("generate.combine.suggestingOverlay.title")}
          description={
            suggestingCompanyName
              ? t("generate.combine.suggestingOverlay.descriptionCompany", {
                  name: suggestingCompanyName,
                })
              : t("generate.combine.suggestingOverlay.description")
          }
        />
      ) : null}

      <CombineSuggestConfirmDialogs
        suggestConfirmOpen={suggestConfirmOpen}
        companySuggestConfirmId={companySuggestConfirmId}
        companySuggestConfirmName={companySuggestConfirmName}
        suggesting={suggesting}
        onCloseSuggestConfirm={() => setSuggestConfirmOpen(false)}
        onConfirmSuggest={confirmSuggest}
        onCloseCompanySuggestConfirm={() => setCompanySuggestConfirmId(null)}
        onConfirmCompanySuggest={confirmCompanySuggest}
      />
    </>
  );
}
