"use client";

import { useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineExperiencePickerDrawer } from "@/components/generate/CombineExperiencePickerDrawer";
import { SortableExperienceIdList } from "@/components/generate/SortableExperienceIdList";
import { AddButton } from "@/components/shared/action-icon-buttons";

type CombineCompanyExperienceListProps = {
  experienceIds: string[];
  rationale?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (experienceIds: string[]) => void;
};

export function CombineCompanyExperienceList({
  experienceIds,
  rationale,
  disabled = false,
  readOnly = false,
  onChange,
}: CombineCompanyExperienceListProps) {
  const t = useT();
  const [pickerOpen, setPickerOpen] = useState(false);

  function addExperience(experienceId: string) {
    if (experienceIds.includes(experienceId)) return;
    onChange([...experienceIds, experienceId]);
  }

  return (
    <div className="flex items-start gap-3 text-sm">
      <span className={`w-36 shrink-0 ${readOnly ? "" : "pt-2"}`}>
        {t("generate.combine.linkedExperiences")}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {!readOnly ? (
          <div className="flex justify-end">
            <AddButton
              label={t("generate.combine.linkExperienceAria")}
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
            />
          </div>
        ) : null}

        <SortableExperienceIdList
          experienceIds={experienceIds}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
        />

        {rationale ? (
          <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("generate.combine.suggestionRationale")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{rationale}</p>
          </div>
        ) : null}
      </div>

      {!readOnly ? (
        <CombineExperiencePickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          linkedExperienceIds={experienceIds}
          onSelect={addExperience}
        />
      ) : null}
    </div>
  );
}
