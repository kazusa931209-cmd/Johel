"use client";

import { useCallback, useMemo } from "react";
import type { GeneratedResume } from "@johel/resume";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { useDraftResumeRefinePanel } from "@/components/generate/useDraftResumeRefinePanel";
import { useDraftResumeRefine } from "@/components/generate/useDraftResumeRefine";
import type { DraftRefineBuilderKind, ResumeLanguage } from "@/lib/api";
import {
  buildLinkedExperienceCompanyLabels,
  getCombineReferencedCompanies,
} from "@/lib/linked-experience-company-labels";
import { usePce } from "@/lib/pce";

type UseGenerateDraftResumeSessionOptions = {
  resume: GeneratedResume | null;
  onResumeChange: (resume: GeneratedResume) => void;
  onResumePersist: () => void | Promise<void>;
  builderKind: DraftRefineBuilderKind;
  generationId: string | null;
  resumeLanguage: ResumeLanguage;
  combineCompanies: CombineCompanyEntry[];
};

export function useGenerateDraftResumeSession({
  resume,
  onResumeChange,
  onResumePersist,
  builderKind,
  generationId,
  resumeLanguage,
  combineCompanies,
}: UseGenerateDraftResumeSessionOptions) {
  const { companies, loading: companiesLoading } = usePce();
  const linkedExperienceIds = useMemo(
    () => combineCompanies.flatMap((entry) => entry.experienceIds),
    [combineCompanies],
  );
  const linkedExperienceCompanyById = useMemo(
    () => buildLinkedExperienceCompanyLabels(combineCompanies, companies),
    [combineCompanies, companies],
  );
  const refineCompanyOptions = useMemo(
    () => getCombineReferencedCompanies(combineCompanies, companies, resume),
    [combineCompanies, companies, resume],
  );

  const { refining, refineParseError, runRefine, setRefineParseError } =
    useDraftResumeRefine({
      builderKind,
      generationId,
      resumeLanguage,
      onRefineSuccess: onResumeChange,
      onResumePersist,
    });

  const {
    panel: refinePanel,
    footerApply: refineFooterApply,
    resetRefineForm,
  } = useDraftResumeRefinePanel({
    disabled: !resume,
    linkedExperienceIds,
    linkedExperienceCompanyById,
    refineCompanyOptions,
    companiesLoading,
    refining,
    parseError: refineParseError,
    onReset: () => setRefineParseError(undefined),
    onApply: async (payload) => {
      const ok = await runRefine(payload);
      if (ok) {
        resetRefineForm();
      }
    },
  });

  return {
    refining,
    refinePanel,
    refineFooterApply,
  };
}
