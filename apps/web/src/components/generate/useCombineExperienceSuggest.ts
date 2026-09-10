"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  runAiCombineRecommend,
  type CombineRecommendResult,
} from "@/lib/api";
import type { ProfileGraduation } from "@/lib/profile";

export function mergeExperienceSuggestions(
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

type UseCombineExperienceSuggestOptions = {
  combine: CombineSnapshot;
  resolveCombineSnapshot?: () => CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  profileGraduation: ProfileGraduation | null;
  generationId?: string | null;
  onSaveBeforeSuggest: () => Promise<{ error?: string }>;
};

export function useCombineExperienceSuggest({
  combine,
  resolveCombineSnapshot,
  onCombineChange,
  job,
  doVerdict,
  profileGraduation,
  generationId,
  onSaveBeforeSuggest,
}: UseCombineExperienceSuggestOptions) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [suggesting, setSuggesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] =
    useState<CombineRecommendResult | null>(null);
  const [suggestSucceeded, setSuggestSucceeded] = useState(false);

  const companySelectionKey = useMemo(
    () => combine.companies.map((entry) => entry.companyId).join(","),
    [combine.companies],
  );

  useEffect(() => {
    setAppliedResult(null);
    setSuggestSucceeded(false);
  }, [combine.profileId, companySelectionKey]);

  const rationaleByCompanyId = useMemo(
    () =>
      new Map(
        appliedResult?.companies.map((item) => [item.companyId, item.rationale]) ??
          [],
      ),
    [appliedResult],
  );

  const warnings = appliedResult?.warnings ?? [];

  const runSuggest = useCallback(async (): Promise<boolean> => {
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
    setSuggestSucceeded(true);
    toast(t("toast.combineRecommendReady"), "success");
    return true;
  }, [
    combine,
    doVerdict,
    generationId,
    job.acceptedMarkdown,
    job.jobText,
    onCombineChange,
    onSaveBeforeSuggest,
    profileGraduation,
    refreshTokenUsed,
    resolveCombineSnapshot,
    setTokenUsed,
    suggesting,
    t,
    toast,
  ]);

  return {
    runSuggest,
    suggesting,
    suggestError,
    fieldErrors,
    appliedResult,
    suggestSucceeded,
    rationaleByCompanyId,
    warnings,
  };
}
