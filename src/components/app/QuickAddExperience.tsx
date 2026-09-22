"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ExperienceFactFormFields } from "@/components/ExperienceFactFormFields";
import { ExperienceSuggestionContent } from "@/components/ExperienceSuggestionContent";
import { isExperienceSuggestionActionable } from "@/lib/experience-advise-suggestion-state";
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
    result,
    displayOperations,
    handleSuggest,
    handleApply,
    resetFlow,
  } = useExperienceAdviseFlow({
    mode: "create",
    onApplySuccess: () => onOpenChange(false),
  });

  const actionable = isExperienceSuggestionActionable(displayOperations);
  const hasDraft = userFacts.trim().length > 0 || result !== null;

  function closeMainDrawer() {
    onOpenChange(false);
  }

  return (
    <>
      <Drawer
        title={t("quickAddExperience.drawerTitle")}
        open={open}
        onClose={closeMainDrawer}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetFlow}
              disabled={!hasDraft}
              aria-label={t("quickAddExperience.resetAria")}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-40"
            >
              {t("quickAddExperience.reset")}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSuggest()}
                className={
                  actionable
                    ? "rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-60"
                    : "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
                }
              >
                {advising
                  ? t("crud.experiences.advisor.running")
                  : actionable
                    ? t("crud.experiences.advisor.suggestAgain")
                    : t("crud.experiences.advisor.suggest")}
              </button>
              {actionable ? (
                <button
                  type="button"
                  onClick={() => void handleApply()}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
                >
                  {applying
                    ? t("crud.experiences.advisor.applying")
                    : t("crud.experiences.advisor.apply")}
                </button>
              ) : null}
            </div>
          </div>
        }
      >
        <div className="p-4">
          <ExperienceFactFormFields
            userFacts={userFacts}
            onUserFactsChange={(value) => {
              setUserFacts(value);
              if (factsError) setFactsError(undefined);
            }}
            factsError={factsError}
            onSuggest={() => void handleSuggest()}
            advising={advising}
            showSuggestButton={false}
            suggestionPanel={
              result ? (
                <ExperienceSuggestionContent
                  result={result}
                  displayOperations={displayOperations}
                  onApply={() => void handleApply()}
                  applying={applying}
                  showApplyButton={false}
                />
              ) : undefined
            }
          />
        </div>
      </Drawer>

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
