"use client";

import { useCallback, useState } from "react";
import { formatThousandsSeparated } from "@/lib/helper";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  applyExperienceAdvise,
  runExperienceAdvise,
  type ExperienceAdviseResult,
} from "@/lib/api";
import {
  buildExperienceAdviseDisplayOperations,
  toExperienceAdviseApplyOperations,
  type ExperienceAdviseDisplayOperation,
} from "@/lib/build-experience-advise-display-operations";
import { isExperienceSuggestionActionable } from "@/lib/experience-advise-suggestion-state";
import { dispatchWorkspaceUpdated } from "@/lib/workspace-updated";

export const EXPERIENCE_FACTS_MAX = 10_000;

type UseExperienceAdviseFlowOptions = {
  mode: "create" | "edit";
  experienceId?: string;
  onApplySuccess?: () => void;
};

export function useExperienceAdviseFlow({
  mode,
  experienceId,
  onApplySuccess,
}: UseExperienceAdviseFlowOptions) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [userFacts, setUserFacts] = useState("");
  const [factsError, setFactsError] = useState<string | undefined>();
  const [advising, setAdvising] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [result, setResult] = useState<ExperienceAdviseResult | null>(null);
  const [displayOperations, setDisplayOperations] = useState<
    ExperienceAdviseDisplayOperation[]
  >([]);
  const [workspaceFingerprint, setWorkspaceFingerprint] = useState<
    string | null
  >(null);

  const resetFlow = useCallback(() => {
    setUserFacts("");
    setFactsError(undefined);
    setSuggestionOpen(false);
    setResult(null);
    setDisplayOperations([]);
    setWorkspaceFingerprint(null);
  }, []);

  async function handleSuggest() {
    const trimmed = userFacts.trim();
    if (!trimmed) {
      setFactsError(t("validation.factsRequired"));
      return;
    }
    if (trimmed.length > EXPERIENCE_FACTS_MAX) {
      setFactsError(
        t("validation.factsMaxLength", {
          max: formatThousandsSeparated(EXPERIENCE_FACTS_MAX),
        }),
      );
      return;
    }
    setFactsError(undefined);
    setAdvising(true);

    const res = await runExperienceAdvise({
      userFacts: trimmed,
      ...(experienceId ? { targetExperienceId: experienceId } : {}),
    });
    setAdvising(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.experienceAdvisorFailed"), "error");
      return;
    }

    const display = await buildExperienceAdviseDisplayOperations(
      res.data.result.operations,
    );

    setResult(res.data.result);
    setDisplayOperations(display);
    setWorkspaceFingerprint(res.data.workspaceFingerprint);
    setTokenUsed(res.data.tokenUsed);
    void refreshTokenUsed();
    setSuggestionOpen(isExperienceSuggestionActionable(display));
    toast(t("toast.experienceSuggestionReady"), "success");
  }

  async function handleApply() {
    if (!workspaceFingerprint || displayOperations.length === 0) return;

    setApplying(true);
    const res = await applyExperienceAdvise({
      workspaceFingerprint,
      operations: toExperienceAdviseApplyOperations(displayOperations),
    });
    setApplying(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.applyFailed"), "error");
      return;
    }

    for (const warning of res.data.warnings) {
      toast(warning, "warning");
    }

    dispatchWorkspaceUpdated({
      experienceId: res.data.experienceIds[0] ?? experienceId ?? null,
    });

    toast(
      mode === "create"
        ? t("toast.experienceCreated")
        : t("toast.experienceUpdated"),
      "success",
    );
    resetFlow();
    onApplySuccess?.();
  }

  return {
    userFacts,
    setUserFacts,
    factsError,
    setFactsError,
    advising,
    applying,
    suggestionOpen,
    setSuggestionOpen,
    result,
    displayOperations,
    handleSuggest,
    handleApply,
    resetFlow,
  };
}
