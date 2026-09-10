"use client";

import {
  FormEvent,
  memo,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import { CombinePeriodDisplay } from "@/components/generate/CombinePeriodDisplay";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  runAiCombineRecommend,
  type CombineRecommendResult,
  type ExperienceDetail,
} from "@/lib/api";
import { usePce } from "@/lib/pce";
import { fullName, type ProfileGraduation } from "@/lib/profile";

type CombineExperienceSuggestProps = {
  combine: CombineSnapshot;
  resolveCombineSnapshot?: () => CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  profileGraduation: ProfileGraduation | null;
  generationId?: string | null;
  onSaveBeforeSuggest: () => Promise<{ error?: string }>;
};

function companyEntriesEqualForSuggest(
  prevCompanies: CombineSnapshot["companies"],
  nextCompanies: CombineSnapshot["companies"],
  includeContextFields: boolean,
): boolean {
  if (prevCompanies.length !== nextCompanies.length) {
    return false;
  }

  for (let index = 0; index < prevCompanies.length; index += 1) {
    const prevEntry = prevCompanies[index];
    const nextEntry = nextCompanies[index];
    if (
      prevEntry.companyId !== nextEntry.companyId ||
      prevEntry.startDate !== nextEntry.startDate ||
      prevEntry.endDate !== nextEntry.endDate ||
      prevEntry.experienceIds.length !== nextEntry.experienceIds.length ||
      prevEntry.experienceIds.some(
        (id, experienceIndex) => id !== nextEntry.experienceIds[experienceIndex],
      )
    ) {
      return false;
    }
    if (
      includeContextFields &&
      (prevEntry.roleContext !== nextEntry.roleContext ||
        prevEntry.keywordContext !== nextEntry.keywordContext)
    ) {
      return false;
    }
  }

  return true;
}

function areCombineExperienceSuggestPropsEqual(
  prev: CombineExperienceSuggestProps,
  next: CombineExperienceSuggestProps,
): boolean {
  if (
    prev.job !== next.job ||
    prev.doVerdict !== next.doVerdict ||
    prev.profileGraduation !== next.profileGraduation ||
    prev.generationId !== next.generationId ||
    prev.resolveCombineSnapshot !== next.resolveCombineSnapshot ||
    prev.onCombineChange !== next.onCombineChange ||
    prev.onSaveBeforeSuggest !== next.onSaveBeforeSuggest
  ) {
    return false;
  }

  const prevCombine = prev.combine;
  const nextCombine = next.combine;
  if (
    prevCombine.profileId !== nextCombine.profileId ||
    prevCombine.emphasis !== nextCombine.emphasis ||
    prevCombine.language !== nextCombine.language
  ) {
    return false;
  }

  const includeContextFields = nextCombine.companies.some(
    (entry) => entry.experienceIds.length > 0,
  );

  return companyEntriesEqualForSuggest(
    prevCombine.companies,
    nextCombine.companies,
    includeContextFields,
  );
}

function CombineSuggestionFieldRow({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex gap-3 text-sm ${align === "start" ? "items-start" : "items-center"}`}
    >
      <span className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function mergeExperienceSuggestions(
  combine: CombineSnapshot,
  result: CombineRecommendResult,
): CombineSnapshot["companies"] {
  const byCompanyId = new Map(
    result.companies.map((item) => [item.companyId, item.experienceIds]),
  );
  return combine.companies.map((entry) => ({
    ...entry,
    experienceIds: byCompanyId.get(entry.companyId) ?? entry.experienceIds,
  }));
}

function CombineSuggestedExperienceList({
  experienceIds,
}: {
  experienceIds: string[];
}) {
  const t = useT();
  const { experiences } = usePce();
  const [viewExperience, setViewExperience] = useState<ExperienceDetail | null>(
    null,
  );
  const experienceById = useMemo(
    () => new Map(experiences.map((item) => [item.id, item])),
    [experiences],
  );

  if (experienceIds.length === 0) {
    return (
      <p className="text-muted">{t("generate.combine.suggestionNoExperiences")}</p>
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {experienceIds.map((id) => {
          const experience = experienceById.get(id);
          const label =
            experience?.category ??
            t("generate.combine.suggestionExperienceMissing");

          return (
            <li key={id}>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 hover:bg-surface-muted">
                <button
                  type="button"
                  onClick={() => {
                    if (experience) setViewExperience(experience);
                  }}
                  disabled={!experience}
                  className="min-w-0 flex-1 truncate text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {label}
                </button>
                <ViewButton
                  disabled={!experience}
                  onClick={() => {
                    if (experience) setViewExperience(experience);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {viewExperience ? (
        <ExperienceDetailDialog
          experience={viewExperience}
          onClose={() => setViewExperience(null)}
        />
      ) : null}
    </>
  );
}

function CombineSuggestionPreview({
  combine,
  appliedResult,
  profileGraduation,
}: {
  combine: CombineSnapshot;
  appliedResult: CombineRecommendResult | null;
  profileGraduation: ProfileGraduation | null;
}) {
  const t = useT();
  const { profiles, companies } = usePce();

  const profile = profiles.find((item) => item.id === combine.profileId);
  const companyNameById = useMemo(
    () => new Map(companies.map((item) => [item.id, item.name])),
    [companies],
  );
  const rationaleByCompanyId = useMemo(
    () =>
      new Map(
        appliedResult?.companies.map((item) => [item.companyId, item.rationale]) ??
          [],
      ),
    [appliedResult],
  );

  return (
    <div className="space-y-4 border-t border-border pt-4 text-sm">
      <h4 className="text-sm font-medium">
        {t("generate.combine.suggestionDialogTitle")}
      </h4>

      {appliedResult && appliedResult.warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-toast-warning-fg">
          {appliedResult.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-md border border-border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("generate.combine.suggestionProfile")}
        </p>
        <p className="mt-1 font-medium">
          {profile
            ? fullName(profile.firstName, profile.lastName)
            : t("generate.combine.suggestionProfileMissing")}
        </p>
      </div>

      <div className="space-y-3">
        {combine.companies.map((entry) => {
          const rationale = rationaleByCompanyId.get(entry.companyId);
          return (
            <div
              key={entry.companyId}
              className="rounded-md border border-border p-3"
            >
              <p className="font-medium">
                {companyNameById.get(entry.companyId) ?? entry.companyId}
              </p>

              <div className="mt-3 space-y-2">
                <CombineSuggestionFieldRow label={t("generate.combine.period")}>
                  <CombinePeriodDisplay
                    startDate={entry.startDate}
                    endDate={entry.endDate}
                    profileGraduation={profileGraduation}
                  />
                </CombineSuggestionFieldRow>
                <CombineSuggestionFieldRow
                  label={t("generate.combine.roleContext")}
                  align="start"
                >
                  <span className="whitespace-pre-wrap">
                    {entry.roleContext.trim() ||
                      t("generate.combine.suggestionNotProvided")}
                  </span>
                </CombineSuggestionFieldRow>
                <CombineSuggestionFieldRow
                  label={t("generate.combine.keywordContext")}
                  align="start"
                >
                  <span className="whitespace-pre-wrap">
                    {entry.keywordContext.trim() ||
                      t("generate.combine.suggestionKeywordContextAuto")}
                  </span>
                </CombineSuggestionFieldRow>
                <CombineSuggestionFieldRow
                  label={t("generate.combine.suggestionExperiences")}
                  align="start"
                >
                  <CombineSuggestedExperienceList
                    experienceIds={entry.experienceIds}
                  />
                </CombineSuggestionFieldRow>
              </div>

              {rationale ? (
                <>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                    {t("generate.combine.suggestionRationale")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">
                    {rationale}
                  </p>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CombineExperienceSuggestInner({
  combine,
  resolveCombineSnapshot,
  onCombineChange,
  job,
  doVerdict,
  profileGraduation,
  generationId,
  onSaveBeforeSuggest,
}: CombineExperienceSuggestProps) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [suggesting, setSuggesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] =
    useState<CombineRecommendResult | null>(null);

  const companySelectionKey = useMemo(
    () => combine.companies.map((entry) => entry.companyId).join(","),
    [combine.companies],
  );

  const hasSuggested =
    appliedResult !== null ||
    combine.companies.some((entry) => entry.experienceIds.length > 0);

  useEffect(() => {
    setAppliedResult(null);
  }, [combine.profileId, companySelectionKey]);

  async function runSuggest(): Promise<boolean> {
    if (suggesting) return false;

    setSuggestError(null);
    const snapshot = resolveCombineSnapshot?.() ?? combine;
    const errors = validateCombineSnapshot(snapshot, t, profileGraduation);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return false;
    }

    const filteredJob = noiseFilter(job.jobText.trim()).text;
    if (!filteredJob) {
      setSuggestError(t("validation.jobDescriptionRequired"));
      return false;
    }
    if (doVerdict && !job.acceptedMarkdown?.trim()) {
      setSuggestError(t("generate.combine.suggestVerdictRequired"));
      return false;
    }
    if (!generationId) {
      setSuggestError(t("generate.combine.suggestGenerationRequired"));
      return false;
    }

    setSuggesting(true);
    const saveRes = await onSaveBeforeSuggest();
    if (saveRes.error) {
      setSuggesting(false);
      toast(saveRes.error, "error");
      return false;
    }

    const res = await runAiCombineRecommend({ generationId });
    setSuggesting(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.combineRecommendFailed"), "error");
      return false;
    }

    if (res.data.tokenUsed != null) {
      setTokenUsed(res.data.tokenUsed);
    } else {
      void refreshTokenUsed();
    }

    onCombineChange({
      ...snapshot,
      companies: mergeExperienceSuggestions(snapshot, res.data),
    });
    setAppliedResult(res.data);
    toast(t("toast.combineRecommendReady"), "success");
    return true;
  }

  async function onSuggest(e: FormEvent) {
    e.preventDefault();
    await runSuggest();
  }

  return (
    <>
      <form onSubmit={onSuggest} className={COMBINE_SECTION_CLASS}>
        <div className="space-y-1">
          <h3 className={COMBINE_SECTION_TITLE_CLASS}>
            {t("generate.combine.experiencesSection")}
          </h3>
          <p className="text-xs text-muted">
            {t("generate.combine.experiencesSectionHint")}
          </p>
        </div>

        {fieldErrors.companies ? (
          <p className="text-sm text-danger">{fieldErrors.companies}</p>
        ) : null}

        {suggestError ? (
          <p className="text-sm text-danger">{suggestError}</p>
        ) : null}

        {hasSuggested ? (
          <>
            <CombineSuggestionPreview
              combine={combine}
              appliedResult={appliedResult}
              profileGraduation={profileGraduation}
            />
            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => void runSuggest()}
                disabled={suggesting}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
              >
                {suggesting
                  ? t("generate.combine.suggesting")
                  : t("generate.combine.suggestAgain")}
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={suggesting}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
            >
              {suggesting
                ? t("generate.combine.suggesting")
                : t("generate.combine.suggestExperiences")}
            </button>
          </div>
        )}
      </form>

      {suggesting ? (
        <BusyOverlay
          title={t("generate.combine.suggestingOverlay.title")}
          description={t("generate.combine.suggestingOverlay.description")}
        />
      ) : null}
    </>
  );
}

export const CombineExperienceSuggest = memo(
  CombineExperienceSuggestInner,
  areCombineExperienceSuggestPropsEqual,
);
