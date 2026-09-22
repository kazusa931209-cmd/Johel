"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  getCombineCompanySuggestError,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import {
  mergeCombineRecommendResults,
  mergeExperienceSuggestions,
  mergeExperienceSuggestionsForCompany,
} from "@/lib/combine-experience-suggest";
import {
  runAiCombineRecommend,
  runAiGeneralCombineRecommend,
  type CombineRecommendResult,
} from "@/lib/api";
import { buildLinkedExperienceRevision } from "@/lib/experience";
import { usePce } from "@/lib/pce";
import type { ProfileGraduation } from "@/lib/profile";

type UseCombineExperienceSuggestOptions = {
  combine: CombineSnapshot;
  resolveCombineSnapshot?: () => CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  profileGraduation: ProfileGraduation | null;
  generationId?: string | null;
  onSaveBeforeSuggest: () => Promise<{ error?: string }>;
  suggestVariant?: "jd" | "general";
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
  suggestVariant = "jd",
}: UseCombineExperienceSuggestOptions) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const { experiences: workspaceExperiences } = usePce();
  const [suggesting, setSuggesting] = useState(false);
  const [suggestingCompanyId, setSuggestingCompanyId] = useState<string | null>(
    null,
  );
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

  const linkedExperienceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of combine.companies) {
      for (const id of entry.experienceIds) {
        ids.add(id);
      }
    }
    return [...ids].sort();
  }, [combine.companies]);

  const linkedExperienceRevision = useMemo(
    () =>
      buildLinkedExperienceRevision(
        linkedExperienceIds,
        workspaceExperiences,
      ),
    [linkedExperienceIds, workspaceExperiences],
  );
  const linkedExperienceRevisionRef = useRef<string | null>(null);

  useEffect(() => {
    if (linkedExperienceRevisionRef.current === null) {
      linkedExperienceRevisionRef.current = linkedExperienceRevision;
      return;
    }
    if (linkedExperienceRevisionRef.current === linkedExperienceRevision) {
      return;
    }
    linkedExperienceRevisionRef.current = linkedExperienceRevision;
    setAppliedResult(null);
    setSuggestSucceeded(false);
  }, [linkedExperienceRevision]);

  const rationaleByCompanyId = useMemo(
    () =>
      new Map(
        appliedResult?.companies.map((item) => [item.companyId, item.rationale]) ??
          [],
      ),
    [appliedResult],
  );

  const warnings = appliedResult?.warnings ?? [];

  const applySuggestResult = useCallback(
    (
      snapshot: CombineSnapshot,
      result: CombineRecommendResult,
      companyId?: string,
    ) => {
      onCombineChange({
        ...snapshot,
        companies: companyId
          ? mergeExperienceSuggestionsForCompany(snapshot, result, companyId)
          : mergeExperienceSuggestions(snapshot, result),
      });
      setAppliedResult((previous) => mergeCombineRecommendResults(previous, result));
      setSuggestSucceeded(true);
      toast(t("toast.combineRecommendReady"), "success");
    },
    [onCombineChange, t, toast],
  );

  const runSuggestRequest = useCallback(
    async (
      snapshot: CombineSnapshot,
      companyId?: string,
    ): Promise<boolean> => {
      if (!generationId) {
        setSuggestError(t("generate.combine.suggestGenerationRequired"));
        return false;
      }

      setSuggesting(true);
      setSuggestingCompanyId(companyId ?? null);
      const saveRes = await onSaveBeforeSuggest();
      if (saveRes.error) {
        setSuggesting(false);
        setSuggestingCompanyId(null);
        toast(saveRes.error, "error");
        return false;
      }

      const res =
        suggestVariant === "general"
          ? await runAiGeneralCombineRecommend({
              generationId,
              companyId,
            })
          : await runAiCombineRecommend({
              generationId,
              companyId,
            });
      setSuggesting(false);
      setSuggestingCompanyId(null);

      if (res.error || !res.data) {
        toast(res.error ?? t("toast.combineRecommendFailed"), "error");
        return false;
      }

      if (res.data.tokenUsed != null) {
        setTokenUsed(res.data.tokenUsed);
      }
      void refreshTokenUsed();

      applySuggestResult(snapshot, res.data, companyId);
      return true;
    },
    [
      applySuggestResult,
      generationId,
      onSaveBeforeSuggest,
      refreshTokenUsed,
      setTokenUsed,
      suggestVariant,
      t,
      toast,
    ],
  );

  const runSuggest = useCallback(async (): Promise<boolean> => {
    if (suggesting) return false;

    setSuggestError(null);
    const snapshot = resolveCombineSnapshot?.() ?? combine;
    const errors = validateCombineSnapshot(snapshot, t, profileGraduation);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return false;
    }

    if (suggestVariant === "jd") {
      const filteredJob = noiseFilter(job.jobText.trim()).text;
      if (!filteredJob) {
        setSuggestError(t("validation.jobDescriptionRequired"));
        return false;
      }
      if (doVerdict && !job.acceptedMarkdown?.trim()) {
        setSuggestError(t("generate.combine.suggestVerdictRequired"));
        return false;
      }
    }

    return runSuggestRequest(snapshot);
  }, [
    combine,
    doVerdict,
    job.acceptedMarkdown,
    job.jobText,
    profileGraduation,
    resolveCombineSnapshot,
    runSuggestRequest,
    suggestVariant,
    suggesting,
    t,
  ]);

  const runSuggestForCompany = useCallback(
    async (companyId: string): Promise<boolean> => {
      if (suggesting) return false;

      setSuggestError(null);
      setFieldErrors({});
      const snapshot = resolveCombineSnapshot?.() ?? combine;
      const companyError = getCombineCompanySuggestError(
        snapshot,
        companyId,
        profileGraduation,
        t,
      );
      if (companyError) {
        setSuggestError(companyError);
        return false;
      }

      if (suggestVariant === "jd") {
        const filteredJob = noiseFilter(job.jobText.trim()).text;
        if (!filteredJob) {
          setSuggestError(t("validation.jobDescriptionRequired"));
          return false;
        }
        if (doVerdict && !job.acceptedMarkdown?.trim()) {
          setSuggestError(t("generate.combine.suggestVerdictRequired"));
          return false;
        }
      }

      return runSuggestRequest(snapshot, companyId);
    },
    [
      combine,
      doVerdict,
      job.acceptedMarkdown,
      job.jobText,
      profileGraduation,
      resolveCombineSnapshot,
      runSuggestRequest,
      suggestVariant,
      suggesting,
      t,
    ],
  );

  const companyNeedsSuggestConfirm = useCallback(
    (companyId: string) => {
      const entry = combine.companies.find((item) => item.companyId === companyId);
      if (!entry) {
        return false;
      }
      return (
        entry.experienceIds.length > 0 || rationaleByCompanyId.has(companyId)
      );
    },
    [combine.companies, rationaleByCompanyId],
  );

  return {
    runSuggest,
    runSuggestForCompany,
    suggesting,
    suggestingCompanyId,
    suggestError,
    fieldErrors,
    appliedResult,
    suggestSucceeded,
    rationaleByCompanyId,
    warnings,
    companyNeedsSuggestConfirm,
  };
}
