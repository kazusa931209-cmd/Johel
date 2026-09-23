"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { GeneratedResume } from "@johel/resume";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { useDraftResumeRefinePanel } from "@/components/generate/useDraftResumeRefinePanel";
import { useDraftResumeHistory } from "@/components/generate/useDraftResumeHistory";
import { useDraftResumeRefine } from "@/components/generate/useDraftResumeRefine";
import type { DraftRefineBuilderKind, ResumeLanguage } from "@/lib/api";
import {
  buildLinkedExperienceCompanyLabels,
  getCombineReferencedCompanies,
} from "@/lib/linked-experience-company-labels";
import { usePce } from "@/lib/pce";

type UseGenerateDraftResumeSessionOptions = {
  resume: GeneratedResume | null;
  generationInputKey: string | null;
  onResumeChange: (resume: GeneratedResume) => void;
  builderKind: DraftRefineBuilderKind;
  generationId: string | null;
  resumeLanguage: ResumeLanguage;
  combineCompanies: CombineCompanyEntry[];
};

export function useGenerateDraftResumeSession({
  resume,
  generationInputKey,
  onResumeChange,
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
    () => getCombineReferencedCompanies(combineCompanies, companies),
    [combineCompanies, companies],
  );
  const {
    canUndo,
    canRedo,
    push: pushDraftHistory,
    undo: undoDraftHistory,
    redo: redoDraftHistory,
    reset: resetDraftHistory,
  } = useDraftResumeHistory(resume);
  const lastResetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!resume || !generationInputKey) return;
    if (lastResetKeyRef.current === generationInputKey) return;
    lastResetKeyRef.current = generationInputKey;
    resetDraftHistory(resume);
  }, [generationInputKey, resetDraftHistory, resume]);

  const onRefineSuccess = useCallback(
    (next: GeneratedResume) => {
      pushDraftHistory(next);
      onResumeChange(next);
    },
    [onResumeChange, pushDraftHistory],
  );

  const { refining, refineParseError, runRefine } = useDraftResumeRefine({
    resume,
    builderKind,
    generationId,
    resumeLanguage,
    onRefineSuccess,
  });

  const handleUndo = useCallback(() => {
    const previous = undoDraftHistory();
    if (previous) {
      onResumeChange(previous);
    }
  }, [onResumeChange, undoDraftHistory]);

  const handleRedo = useCallback(() => {
    const next = redoDraftHistory();
    if (next) {
      onResumeChange(next);
    }
  }, [onResumeChange, redoDraftHistory]);

  const { panel: refinePanel, headerApply: refineHeaderApply } =
    useDraftResumeRefinePanel({
      disabled: !resume,
      linkedExperienceIds,
      linkedExperienceCompanyById,
      refineCompanyOptions,
      companiesLoading,
      refining,
      parseError: refineParseError,
      onApply: (payload) => void runRefine(payload),
    });

  return {
    canUndo,
    canRedo,
    pushDraftHistory,
    handleUndo,
    handleRedo,
    refining,
    refinePanel,
    refineHeaderApply,
  };
}
