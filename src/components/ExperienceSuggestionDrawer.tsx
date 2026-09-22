"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ExperienceSuggestionContent } from "@/components/ExperienceSuggestionContent";
import { Drawer } from "@/components/shared/drawer";
import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

type ExperienceSuggestionDrawerProps = {
  open: boolean;
  onClose: () => void;
  result: ExperienceAdviseResult | null;
  displayOperations: ExperienceAdviseDisplayOperation[];
  onApply: () => void;
  applying: boolean;
};

export function ExperienceSuggestionDrawer({
  open,
  onClose,
  result,
  displayOperations,
  onApply,
  applying,
}: ExperienceSuggestionDrawerProps) {
  const t = useT();
  const actionable = displayOperations.length > 0;

  return (
    <Drawer
      title={t("crud.experiences.advisor.suggestionTitle")}
      open={open && result != null}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
      footer={
        actionable ? (
          <button
            type="button"
            onClick={onApply}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {applying
              ? t("crud.experiences.advisor.applying")
              : t("crud.experiences.advisor.apply")}
          </button>
        ) : undefined
      }
    >
      <div
        className={
          actionable
            ? "p-4"
            : "min-h-0 flex-1 overflow-y-auto p-4"
        }
      >
        {result ? (
          <ExperienceSuggestionContent
            result={result}
            displayOperations={displayOperations}
            onApply={onApply}
            applying={applying}
            showApplyButton={false}
          />
        ) : null}
      </div>
    </Drawer>
  );
}
