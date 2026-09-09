"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ExperienceFactFormFields } from "@/components/ExperienceFactFormFields";
import { ExperienceSuggestionDialog } from "@/components/ExperienceSuggestionDialog";
import { BackButton } from "@/components/shared/back-button";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { useCrudFormNavigation } from "@/lib/crud-form-navigation";
import { useExperienceAdviseFlow } from "@/lib/use-experience-advise-flow";

type ExperienceFactFormProps = {
  mode: "create" | "edit";
  experienceId?: string;
  initialCategory?: string;
};

export function ExperienceFactForm({
  mode,
  experienceId,
  initialCategory,
}: ExperienceFactFormProps) {
  const t = useT();
  const { goBack } = useCrudFormNavigation("/experiences");

  const {
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
  } = useExperienceAdviseFlow({
    mode,
    experienceId,
    onApplySuccess: goBack,
  });

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

        <ExperienceFactFormFields
          userFacts={userFacts}
          onUserFactsChange={(value) => {
            setUserFacts(value);
            if (factsError) setFactsError(undefined);
          }}
          factsError={factsError}
          onSuggest={() => void handleSuggest()}
          advising={advising}
          editingCategory={
            mode === "edit" ? initialCategory : undefined
          }
        />
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
