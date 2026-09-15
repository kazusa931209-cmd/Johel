"use client";

import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  applyExperienceSplit,
  runExperienceSplit,
  type ExperienceSplitResult,
} from "@/lib/api";
import {
  buildExperienceSplitDisplayOperations,
  mapSplitResultToAdviseShape,
  toExperienceSplitApplyOperations,
} from "@/lib/build-experience-split-display-operations";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";
import { notifyExperienceWorkspaceChanged } from "@/lib/workspace-experience";

type UseExperienceSplitFlowOptions = {
  experienceId: string;
  onApplySuccess?: () => void;
};

export function useExperienceSplitFlow({
  experienceId,
  onApplySuccess,
}: UseExperienceSplitFlowOptions) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [suggesting, setSuggesting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ExperienceSplitResult | null>(null);
  const [displayOperations, setDisplayOperations] = useState<
    ExperienceAdviseDisplayOperation[]
  >([]);
  const [workspaceFingerprint, setWorkspaceFingerprint] = useState<
    string | null
  >(null);

  const resetFlow = useCallback(() => {
    setResult(null);
    setDisplayOperations([]);
    setWorkspaceFingerprint(null);
  }, []);

  async function handleSuggest() {
    setSuggesting(true);
    const res = await runExperienceSplit({ experienceId });
    setSuggesting(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.experienceSplitFailed"), "error");
      return;
    }

    const display = buildExperienceSplitDisplayOperations(
      res.data.result.operations,
    );

    setResult(res.data.result);
    setDisplayOperations(display);
    setWorkspaceFingerprint(res.data.workspaceFingerprint);
    setTokenUsed(res.data.tokenUsed);
    void refreshTokenUsed();
    toast(t("toast.experienceSplitReady"), "success");
  }

  async function handleApply() {
    if (!workspaceFingerprint || displayOperations.length === 0) return;

    setApplying(true);
    const res = await applyExperienceSplit({
      experienceId,
      workspaceFingerprint,
      operations: toExperienceSplitApplyOperations(displayOperations),
    });
    setApplying(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.applyFailed"), "error");
      return;
    }

    for (const warning of res.data.warnings) {
      toast(warning, "warning");
    }

    notifyExperienceWorkspaceChanged(res.data.experienceIds[0] ?? null);
    toast(t("toast.experienceSplitApplied"), "success");
    resetFlow();
    onApplySuccess?.();
  }

  const adviseShapedResult = result ? mapSplitResultToAdviseShape(result) : null;

  return {
    suggesting,
    applying,
    result,
    adviseShapedResult,
    displayOperations,
    handleSuggest,
    handleApply,
    resetFlow,
  };
}
