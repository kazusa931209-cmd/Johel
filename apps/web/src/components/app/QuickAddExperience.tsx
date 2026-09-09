"use client";

import { useEffect } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { ExperienceFactFormFields } from "@/components/ExperienceFactFormFields";
import { ExperienceSuggestionDrawer } from "@/components/ExperienceSuggestionDrawer";
import { ExperienceSuggestionReferencePanel } from "@/components/ExperienceSuggestionReferencePanel";
import { shouldShowInlineExperienceSuggestionReference } from "@/lib/experience-advise-suggestion-state";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { Drawer } from "@/components/shared/drawer";
import { useExperienceAdviseFlow } from "@/lib/use-experience-advise-flow";

type QuickAddExperienceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickAddExperience({
  open,
  onOpenChange,
}: QuickAddExperienceProps) {
  const t = useT();

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
    resetFlow,
  } = useExperienceAdviseFlow({
    mode: "create",
    onApplySuccess: () => onOpenChange(false),
  });

  useEffect(() => {
    if (!open) {
      resetFlow();
    }
  }, [open, resetFlow]);

  function closeMainDrawer() {
    onOpenChange(false);
  }

  return (
    <>
      <Drawer
        title={t("quickAddExperience.drawerTitle")}
        open={open}
        onClose={closeMainDrawer}
        closeOnEscape={!suggestionOpen}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <ExperienceFactFormFields
            userFacts={userFacts}
            onUserFactsChange={(value) => {
              setUserFacts(value);
              if (factsError) setFactsError(undefined);
            }}
            factsError={factsError}
            onSuggest={() => void handleSuggest()}
            advising={advising}
            referencePanel={
              shouldShowInlineExperienceSuggestionReference(
                result,
                displayOperations,
              ) ? (
                <ExperienceSuggestionReferencePanel result={result} />
              ) : undefined
            }
          />
        </div>
      </Drawer>

      <ExperienceSuggestionDrawer
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
      ) : applying ? (
        <BusyOverlay
          title={t("crud.experiences.advisor.applyingBusy.title")}
          description={t("crud.experiences.advisor.applyingBusy.description")}
        />
      ) : null}
    </>
  );
}
