"use client";

import { useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { ExperienceSuggestionDialog } from "@/components/ExperienceSuggestionDialog";
import { BackButton } from "@/components/shared/back-button";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
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
import { useCrudFormNavigation } from "@/lib/crud-form-navigation";
import { dispatchWorkspaceUpdated } from "@/lib/workspace-updated";

const FACTS_MAX = 10_000;

type ExperienceFactFormProps = {
  mode: "create" | "edit";
  experienceId?: string;
  initialCategory?: string;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

export function ExperienceFactForm({
  mode,
  experienceId,
  initialCategory,
}: ExperienceFactFormProps) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const { goBack } = useCrudFormNavigation("/experiences");
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

  async function handleSuggest() {
    const trimmed = userFacts.trim();
    if (!trimmed) {
      setFactsError(t("validation.factsRequired"));
      return;
    }
    if (trimmed.length > FACTS_MAX) {
      setFactsError(t("validation.factsMaxLength", { max: FACTS_MAX }));
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
    setSuggestionOpen(true);
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
    goBack();
  }

  return (
    <>
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <BackButton
            href="/experiences"
            preferHistoryBack
            aria-label={t("crud.experiences.form.backAria")}
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "create"
              ? t("crud.experiences.form.addTitle")
              : t("crud.experiences.form.editTitle")}
          </h1>
        </div>

        {mode === "edit" && initialCategory ? (
          <p className="text-sm text-muted">
            {t("crud.experiences.advisor.editingCard", {
              category: initialCategory,
            })}
          </p>
        ) : null}

        <p className="text-sm text-muted">
          {t("crud.experiences.advisor.description")}
        </p>

        <label className="block space-y-1 text-sm">
          <span>
            {t("crud.experiences.advisor.factsLabel")}
            <RequiredMark />
          </span>
          <textarea
            value={userFacts}
            onChange={(event) => {
              setUserFacts(event.target.value);
              if (factsError) setFactsError(undefined);
            }}
            rows={16}
            maxLength={FACTS_MAX}
            placeholder={t("crud.experiences.advisor.factsPlaceholder")}
            aria-invalid={Boolean(factsError)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
          />
          {factsError ? (
            <p className="text-sm text-danger">{factsError}</p>
          ) : null}
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSuggest()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {advising
              ? t("crud.experiences.advisor.running")
              : t("crud.experiences.advisor.suggest")}
          </button>
        </div>
      </section>

      <ExperienceSuggestionDialog
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        result={result}
        displayOperations={displayOperations}
        onApply={() => void handleApply()}
        applying={applying}
      />

      {advising ? (
        <BusyOverlay
          title={t("crud.experiences.advisor.busy.title")}
          description={t("crud.experiences.advisor.busy.description")}
        />
      ) : null}
    </>
  );
}
