"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { DraftRefineExperiencePickerDrawer } from "@/components/generate/DraftRefineExperiencePickerDrawer";
import { SortableExperienceIdList } from "@/components/generate/SortableExperienceIdList";
import { SettingsSelect } from "@/components/shared/settings-select";
import type { CombineReferencedCompany } from "@/lib/linked-experience-company-labels";

const outlineButtonClass =
  "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

type DraftResumeRefinePanelProps = {
  disabled?: boolean;
  linkedExperienceIds: string[];
  linkedExperienceCompanyById: ReadonlyMap<string, string>;
  refineCompanyOptions: CombineReferencedCompany[];
  companiesLoading: boolean;
  refining: boolean;
  parseError?: string;
  instruction: string;
  onInstructionChange: (value: string) => void;
  instructionMax: number;
  validationError?: string;
  onClearValidationError: () => void;
  selectedExperienceIds: string[];
  onSelectedExperienceIdsChange: (ids: string[]) => void;
  companyId: string;
  onCompanyIdChange: (companyId: string) => void;
};

export function DraftResumeRefinePanel({
  disabled = false,
  linkedExperienceIds,
  linkedExperienceCompanyById,
  refineCompanyOptions,
  companiesLoading,
  refining,
  parseError,
  instruction,
  onInstructionChange,
  instructionMax,
  validationError,
  onClearValidationError,
  selectedExperienceIds,
  onSelectedExperienceIdsChange,
  companyId,
  onCompanyIdChange,
}: DraftResumeRefinePanelProps) {
  const t = useT();
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleCompanyChange(nextCompanyId: string) {
    onCompanyIdChange(nextCompanyId);
    if (!nextCompanyId) {
      onSelectedExperienceIdsChange([]);
      setPickerOpen(false);
    }
    if (validationError) onClearValidationError();
  }

  function clearCompany() {
    handleCompanyChange("");
  }

  useEffect(() => {
    if (!companyId) {
      setPickerOpen(false);
    }
  }, [companyId]);

  function clearExperiences() {
    onSelectedExperienceIdsChange([]);
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted">{t("generate.generateStep.noResume")}</p>
    );
  }

  const companyFieldDisabled =
    companiesLoading || refining || refineCompanyOptions.length === 0;
  const canClearCompany = Boolean(companyId);
  const canClearExperiences = selectedExperienceIds.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{t("generate.generateStep.refine.hint")}</p>

      <label className="block space-y-1 text-sm">
        <span>{t("generate.generateStep.refine.companyLabel")}</span>
        <div className="flex items-center gap-2">
          <SettingsSelect
            value={companyId}
            onChange={(event) => handleCompanyChange(event.target.value)}
            disabled={companyFieldDisabled}
            wrapperClassName="relative min-w-0 flex-1"
          >
            <option value="">
              {t("generate.generateStep.refine.companyNone")}
            </option>
            {refineCompanyOptions.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </SettingsSelect>
          <button
            type="button"
            onClick={clearCompany}
            disabled={companyFieldDisabled || !canClearCompany}
            className={outlineButtonClass}
          >
            {t("generate.generateStep.refine.clear")}
          </button>
        </div>
        {refineCompanyOptions.length === 0 && !companiesLoading ? (
          <p className="text-xs text-muted">
            {t("generate.generateStep.refine.companyNoneOnResume")}
          </p>
        ) : null}
      </label>

      {companyId ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">
              {t("generate.generateStep.refine.experiencesLabel")}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={clearExperiences}
                disabled={refining || !canClearExperiences}
                className={outlineButtonClass}
              >
                {t("generate.generateStep.refine.clear")}
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={refining}
                className={outlineButtonClass}
              >
                {t("generate.generateStep.refine.select")}
              </button>
            </div>
          </div>

          <SortableExperienceIdList
            experienceIds={selectedExperienceIds}
            onChange={onSelectedExperienceIdsChange}
            disabled={refining}
            emptyLabel={t("generate.generateStep.refine.experiencesEmpty")}
          />
        </div>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span>{t("generate.generateStep.refine.promptLabel")}</span>
        <textarea
          value={instruction}
          onChange={(event) => {
            onInstructionChange(event.target.value.slice(0, instructionMax));
            if (validationError) onClearValidationError();
          }}
          placeholder={t("generate.generateStep.refine.instructionPlaceholder")}
          aria-invalid={Boolean(validationError)}
          className="min-h-56 w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
      </label>

      <FieldError message={validationError} />
      {parseError ? (
        <p className="text-sm text-danger">
          {t("generate.generateStep.parseError", { error: parseError })}
        </p>
      ) : null}

      {companyId ? (
        <DraftRefineExperiencePickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          linkedExperienceIds={linkedExperienceIds}
          linkedExperienceCompanyById={linkedExperienceCompanyById}
          selectedIds={selectedExperienceIds}
          onSelectedIdsChange={onSelectedExperienceIdsChange}
        />
      ) : null}
    </div>
  );
}
