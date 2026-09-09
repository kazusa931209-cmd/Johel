"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ExperienceSuggestionContent } from "@/components/ExperienceSuggestionContent";
import { DetailDialog } from "@/components/shared/detail-dialog";
import type { ExperienceAdviseResult } from "@/lib/api";
import type { ExperienceAdviseDisplayOperation } from "@/lib/build-experience-advise-display-operations";

type ExperienceSuggestionDialogProps = {
  open: boolean;
  onClose: () => void;
  result: ExperienceAdviseResult | null;
  displayOperations: ExperienceAdviseDisplayOperation[];
  onApply: () => void;
  applying: boolean;
};

export function ExperienceSuggestionDialog({
  open,
  onClose,
  result,
  displayOperations,
  onApply,
  applying,
}: ExperienceSuggestionDialogProps) {
  const t = useT();

  if (!open || !result) return null;

  return (
    <DetailDialog
      title={t("crud.experiences.advisor.suggestionTitle")}
      onClose={onClose}
      mode="view"
      panelClassName="max-w-[96rem]"
    >
      <ExperienceSuggestionContent
        result={result}
        displayOperations={displayOperations}
        onApply={onApply}
        applying={applying}
      />
    </DetailDialog>
  );
}
