"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ExperienceFactFormFields } from "@/components/ExperienceFactFormFields";
import { ExperienceSuggestionContent } from "@/components/ExperienceSuggestionContent";
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
      <section className="w-full max-w-3xl space-y-6">
        <BackButton
          href="/experiences"
          preferHistoryBack
          aria-label={t("crud.experiences.form.backAria")}
        />

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
          suggestionPanel={
            result ? (
              <ExperienceSuggestionContent
                result={result}
                displayOperations={displayOperations}
                onApply={() => void handleApply()}
                applying={applying}
              />
            ) : undefined
          }
        />
      </section>

      {advising ? (
        <BusyOverlay
          title={t("crud.experiences.advisor.busy.title")}
          description={t("crud.experiences.advisor.busy.description")}
        />
      ) : applying ? (
        <BusyOverlay
          title={t("crud.experiences.advisor.applyingBusy.title")}
          description={t("crud.experiences.advisor.applyingBusy.description")}
        />
      ) : null}
    </>
  );
}
