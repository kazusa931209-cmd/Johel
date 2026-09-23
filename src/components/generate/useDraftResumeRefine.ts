"use client";

import { useCallback, useRef, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import type { DraftRefineBuilderKind, ResumeLanguage } from "@/lib/api";
import { runAiDraftRefine } from "@/lib/api";

type UseDraftResumeRefineOptions = {
  builderKind: DraftRefineBuilderKind;
  generationId: string | null;
  resumeLanguage: ResumeLanguage;
  onRefineSuccess: (resume: GeneratedResume) => void;
  onResumePersist?: () => void | Promise<void>;
};

export function useDraftResumeRefine({
  builderKind,
  generationId,
  resumeLanguage,
  onRefineSuccess,
  onResumePersist,
}: UseDraftResumeRefineOptions) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const [refining, setRefining] = useState(false);
  const [refineParseError, setRefineParseError] = useState<string | undefined>();
  const refiningRef = useRef(false);

  const runRefine = useCallback(
    async (payload: {
      mode: "instruction" | "experiences";
      instruction?: string;
      experienceIds?: string[];
      companyId?: string;
    }): Promise<boolean> => {
      if (refiningRef.current || !generationId) return false;
      refiningRef.current = true;
      setRefining(true);
      setRefineParseError(undefined);

      try {
        const res = await runAiDraftRefine({
          builderKind,
          generationId,
          language: resumeLanguage,
          ...payload,
        });
        if (!res.data) {
          toast(res.error ?? t("toast.draftResumeRefineFailed"), "error");
          if (res.error) {
            setRefineParseError(res.error);
          }
          return false;
        }

        onRefineSuccess(res.data.resume);
        await onResumePersist?.();
        await refreshTokenUsed();
        toast(t("toast.draftResumeRefined"), "success");
        return true;
      } catch {
        toast(t("toast.draftResumeRefineFailed"), "error");
        return false;
      } finally {
        refiningRef.current = false;
        setRefining(false);
      }
    },
    [
      builderKind,
      generationId,
      onRefineSuccess,
      onResumePersist,
      refreshTokenUsed,
      resumeLanguage,
      t,
      toast,
    ],
  );

  return {
    refining,
    refineParseError,
    runRefine,
    setRefineParseError,
  };
}
