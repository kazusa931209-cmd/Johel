"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  runAiCombineRecommend,
  type CombineRecommendResult,
} from "@/lib/api";
import { usePce } from "@/lib/pce";

type CombineExperienceSuggestProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  graduationYear: number | null;
  generationId?: string | null;
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
  generationId,
}: CombineExperienceSuggestProps) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [suggesting, setSuggesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] =
    useState<CombineRecommendResult | null>(null);
  const { companies, experiences } = usePce();

  const categoryById = useMemo(
    () => new Map(experiences.map((item) => [item.id, item.category])),
    [experiences],
  );

  const companyNameById = useMemo(
    () => new Map(companies.map((item) => [item.id, item.name])),
    [companies],
  );

  async function runSuggest(): Promise<boolean> {
    if (suggesting) return false;

    setSuggestError(null);
    const errors = validateCombineSnapshot(combine, t, graduationYear);
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

    setSuggesting(true);
    const res = await runAiCombineRecommend({
      jobDescription: filteredJob,
      acceptedMarkdown: doVerdict
        ? job.acceptedMarkdown?.trim() || undefined
        : undefined,
      profileId: combine.profileId,
      companies: combine.companies,
      generationId,
    });
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

    setPendingResult(res.data);
    return true;
  }

  async function onSuggest(e: FormEvent) {
    e.preventDefault();
    await runSuggest();
  }

  function onCancelSuggestions() {
    setPendingResult(null);
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

        {pendingResult ? (
          <div className="space-y-4 border-t border-border pt-4 text-sm">
            <h4 className="text-sm font-medium">
              {t("generate.combine.suggestionDialogTitle")}
            </h4>

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

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onCancelSuggestions}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                {t("generate.combine.suggestionCancel")}
              </button>
              <button
                type="button"
                onClick={() => void runSuggest()}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                {t("generate.combine.suggestionRetry")}
              </button>
              <button
                type="button"
                onClick={onApplySuggestions}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                {t("generate.combine.suggestionApply")}
              </button>
            </div>
          </div>
        ) : null}
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
