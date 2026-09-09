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

  return (
    <Drawer
      title={t("crud.experiences.advisor.suggestionTitle")}
      open={open && result != null}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {result ? (
          <ExperienceSuggestionContent
            result={result}
            displayOperations={displayOperations}
            onApply={onApply}
            applying={applying}
          />
        ) : null}
      </div>
    </Drawer>
  );
}
