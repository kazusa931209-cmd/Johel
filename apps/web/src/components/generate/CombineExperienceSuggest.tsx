"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  type CombineSuggestMode,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { DetailDialog } from "@/components/shared/detail-dialog";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  listCompanies,
  listExperiences,
  runAiCombineRecommend,
  type CombineRecommendResult,
} from "@/lib/api";

type CombineExperienceSuggestProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  graduationYear: number | null;
};

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

export function CombineExperienceSuggest({
  combine,
  onCombineChange,
  job,
  doVerdict,
  graduationYear,
}: CombineExperienceSuggestProps) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [suggesting, setSuggesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] =
    useState<CombineRecommendResult | null>(null);
  const [categoryById, setCategoryById] = useState<Map<string, string>>(
    new Map(),
  );
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (!pendingResult) return;
    let cancelled = false;
    Promise.all([listExperiences("", null), listCompanies("", null)]).then(
      ([experiencesRes, companiesRes]) => {
        if (cancelled) return;
        setCategoryById(
          new Map(
            (experiencesRes.data?.items ?? []).map((item) => [
              item.id,
              item.category,
            ]),
          ),
        );
        setCompanyNameById(
          new Map(
            (companiesRes.data?.items ?? []).map((item) => [item.id, item.name]),
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [pendingResult]);

  function patchCombine(patch: Partial<CombineSnapshot>) {
    onCombineChange({ ...combine, ...patch });
  }

  function validateForSuggest(): CombineFieldErrors {
    const errors = validateCombineSnapshot(combine, t, graduationYear);
    if (combine.experienceSuggestMode === "guided") {
      if (!combine.experienceGuidanceKeywords.trim()) {
        errors.experienceGuidanceKeywords = t(
          "validation.experienceGuidanceKeywordsRequired",
        );
      }
    }
    return errors;
  }

  async function onSuggest(e: FormEvent) {
    e.preventDefault();
    setSuggestError(null);
    const errors = validateForSuggest();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const filteredJob = noiseFilter(job.jobText.trim()).text;
    if (!filteredJob) {
      setSuggestError(t("validation.jobDescriptionRequired"));
      return;
    }
    if (doVerdict && !job.acceptedMarkdown?.trim()) {
      setSuggestError(t("generate.combine.suggestVerdictRequired"));
      return;
    }

    setSuggesting(true);
    const res = await runAiCombineRecommend({
      jobDescription: filteredJob,
      acceptedMarkdown: doVerdict
        ? job.acceptedMarkdown?.trim() || undefined
        : undefined,
      mode: combine.experienceSuggestMode,
      guidanceKeywords:
        combine.experienceSuggestMode === "guided"
          ? combine.experienceGuidanceKeywords.trim()
          : undefined,
      profileId: combine.profileId,
      companies: combine.companies,
    });
    setSuggesting(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.combineRecommendFailed"), "error");
      return;
    }

    if (res.data.tokenUsed != null) {
      setTokenUsed(res.data.tokenUsed);
    } else {
      void refreshTokenUsed();
    }

    setPendingResult(res.data);
  }

  function onApplySuggestions() {
    if (!pendingResult) return;
    onCombineChange({
      ...combine,
      companies: mergeExperienceSuggestions(combine, pendingResult),
    });
    setPendingResult(null);
    toast(t("toast.combineRecommendReady"), "success");
  }

  const modeOptions: { value: CombineSuggestMode; labelKey: string; hintKey: string }[] =
    [
      {
        value: "guided",
        labelKey: "generate.combine.modeGuided",
        hintKey: "generate.combine.modeGuidedHint",
      },
      {
        value: "auto",
        labelKey: "generate.combine.modeAuto",
        hintKey: "generate.combine.modeAutoHint",
      },
    ];

  return (
    <>
      <form
        onSubmit={onSuggest}
        className="space-y-4 rounded-lg border border-border bg-surface p-4"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            {t("generate.combine.experiencesSection")}
          </h3>
          <p className="text-xs text-muted">
            {t("generate.combine.experiencesSectionHint")}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm">{t("generate.combine.suggestMode")}</legend>
          {modeOptions.map((option) => {
            const active = combine.experienceSuggestMode === option.value;
            return (
              <label
                key={option.value}
                className={`block cursor-pointer rounded-md border px-3 py-2 ${
                  active
                    ? "border-accent bg-surface-muted"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="experienceSuggestMode"
                    checked={active}
                    onChange={() =>
                      patchCombine({ experienceSuggestMode: option.value })
                    }
                    className="h-4 w-4 border-border"
                  />
                  <span className="font-medium">{t(option.labelKey)}</span>
                </div>
                <p className="mt-1 pl-6 text-xs text-muted">
                  {t(option.hintKey)}
                </p>
              </label>
            );
          })}
        </fieldset>

        {combine.experienceSuggestMode === "guided" ? (
          <label className="block space-y-1 text-sm">
            <span>
              {t("generate.combine.guidanceKeywords")}
              <span className="ml-0.5 text-danger" aria-hidden>
                *
              </span>
            </span>
            <p className="text-xs text-muted">
              {t("generate.combine.guidanceKeywordsHint")}
            </p>
            <input
              type="text"
              value={combine.experienceGuidanceKeywords}
              onChange={(e) => {
                patchCombine({ experienceGuidanceKeywords: e.target.value });
                setFieldErrors((errors) => ({
                  ...errors,
                  experienceGuidanceKeywords: undefined,
                }));
              }}
              placeholder={t("generate.combine.guidanceKeywordsPlaceholder")}
              aria-invalid={Boolean(fieldErrors.experienceGuidanceKeywords)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
            />
            {fieldErrors.experienceGuidanceKeywords ? (
              <p className="text-sm text-danger">
                {fieldErrors.experienceGuidanceKeywords}
              </p>
            ) : null}
          </label>
        ) : null}

        {fieldErrors.companies ? (
          <p className="text-sm text-danger">{fieldErrors.companies}</p>
        ) : null}

        {suggestError ? (
          <p className="text-sm text-danger">{suggestError}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {suggesting
              ? t("generate.combine.suggesting")
              : t("generate.combine.suggestExperiences")}
          </button>
        </div>
      </form>

      {pendingResult ? (
        <DetailDialog
          title={t("generate.combine.suggestionDialogTitle")}
          onClose={() => setPendingResult(null)}
          mode="view"
          panelClassName="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            {pendingResult.warnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-toast-warning-fg">
                {pendingResult.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}

            <div className="space-y-3">
              {pendingResult.companies.map((company) => (
                <div
                  key={company.companyId}
                  className="rounded-md border border-border p-3"
                >
                  <p className="font-medium">
                    {companyNameById.get(company.companyId) ??
                      company.companyId}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {t("generate.combine.suggestionExperiences")}
                  </p>
                  {company.experienceIds.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                      {company.experienceIds.map((id) => (
                        <li key={id}>
                          {categoryById.get(id) ??
                            t("generate.combine.suggestionExperienceMissing")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted">
                      {t("generate.combine.suggestionNoExperiences")}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {t("generate.combine.suggestionRationale")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">
                    {company.rationale}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onApplySuggestions}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                {t("generate.combine.suggestionApply")}
              </button>
            </div>
          </div>
        </DetailDialog>
      ) : null}
    </>
  );
}
