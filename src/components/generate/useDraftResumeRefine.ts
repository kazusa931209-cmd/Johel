"use client";

import { useCallback, useRef, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import type { DraftRefineBuilderKind, ResumeLanguage } from "@/lib/api";
import { runAiDraftRefine } from "@/lib/api";

type UseDraftResumeRefineOptions = {
  resume: GeneratedResume | null;
  builderKind: DraftRefineBuilderKind;
  generationId: string | null;
  resumeLanguage: ResumeLanguage;
  onRefineSuccess: (resume: GeneratedResume) => void;
};

export function useDraftResumeRefine({
  resume,
  builderKind,
  generationId,
  resumeLanguage,
  onRefineSuccess,
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
    }) => {
      if (!resume || refiningRef.current || !generationId) return;
      refiningRef.current = true;
      setRefining(true);
      setRefineParseError(undefined);

      try {
        const res = await runAiDraftRefine({
          builderKind,
          generationId,
          resume,
          language: resumeLanguage,
          ...payload,
        });
        if (!res.data) {
          toast(res.error ?? t("toast.draftResumeRefineFailed"), "error");
          if (res.error) {
            setRefineParseError(res.error);
          }
          return;
        }

        onRefineSuccess(res.data.resume);
        await refreshTokenUsed();
        toast(t("toast.draftResumeRefined"), "success");
      } catch {
        toast(t("toast.draftResumeRefineFailed"), "error");
      } finally {
        refiningRef.current = false;
        setRefining(false);
      }
    },
    [
      builderKind,
      generationId,
      onRefineSuccess,
      refreshTokenUsed,
      resume,
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
