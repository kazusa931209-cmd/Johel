"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { DraftResumeRefinePanel } from "@/components/generate/DraftResumeRefinePanel";
import type { CombineReferencedCompany } from "@/lib/linked-experience-company-labels";

const INSTRUCTION_MAX = 10_000;

type UseDraftResumeRefinePanelOptions = {
  disabled?: boolean;
  linkedExperienceIds: string[];
  linkedExperienceCompanyById: ReadonlyMap<string, string>;
  refineCompanyOptions: CombineReferencedCompany[];
  companiesLoading: boolean;
  refining: boolean;
  parseError?: string;
  onReset?: () => void;
  onApply: (input: {
    mode: "instruction" | "experiences";
    instruction?: string;
    experienceIds?: string[];
    companyId?: string;
  }) => void | Promise<void>;
};

export function useDraftResumeRefinePanel({
  disabled = false,
  linkedExperienceIds,
  linkedExperienceCompanyById,
  refineCompanyOptions,
  companiesLoading,
  refining,
  parseError,
  onReset,
  onApply,
}: UseDraftResumeRefinePanelOptions): {
  panel: ReactNode;
  footerApply: ReactNode | null;
  resetRefineForm: () => void;
} {
  const t = useT();
  const [instruction, setInstruction] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>();
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<string[]>(
    [],
  );
  const [companyId, setCompanyId] = useState("");

  const resetRefineForm = useCallback(() => {
    setInstruction("");
    setValidationError(undefined);
    setSelectedExperienceIds([]);
    setCompanyId("");
    onReset?.();
  }, [onReset]);

  useEffect(() => {
    if (!companyId) return;
    if (!refineCompanyOptions.some((company) => company.id === companyId)) {
      setCompanyId("");
    }
  }, [companyId, refineCompanyOptions]);

  const handleApply = useCallback(() => {
    void (async () => {
      const trimmedInstruction = instruction.trim();
      const hasCompany = Boolean(companyId.trim());

      if (!hasCompany) {
        if (!trimmedInstruction) {
          setValidationError(
            t("generate.generateStep.refine.instructionRequired"),
          );
          return;
        }
        setValidationError(undefined);
        await onApply({ mode: "instruction", instruction: trimmedInstruction });
        return;
      }

      setValidationError(undefined);
      await onApply({
        mode: "experiences",
        experienceIds:
          selectedExperienceIds.length > 0 ? selectedExperienceIds : [],
        companyId: companyId.trim(),
        instruction: trimmedInstruction || undefined,
      });
    })();
  }, [
    companyId,
    instruction,
    onApply,
    selectedExperienceIds,
    t,
  ]);

  const panel = useMemo(
    () => (
      <DraftResumeRefinePanel
        disabled={disabled}
        linkedExperienceIds={linkedExperienceIds}
        linkedExperienceCompanyById={linkedExperienceCompanyById}
        refineCompanyOptions={refineCompanyOptions}
        companiesLoading={companiesLoading}
        refining={refining}
        parseError={parseError}
        instruction={instruction}
        onInstructionChange={setInstruction}
        instructionMax={INSTRUCTION_MAX}
        validationError={validationError}
        onClearValidationError={() => setValidationError(undefined)}
        selectedExperienceIds={selectedExperienceIds}
        onSelectedExperienceIdsChange={setSelectedExperienceIds}
        companyId={companyId}
        onCompanyIdChange={setCompanyId}
      />
    ),
    [
      companyId,
      disabled,
      instruction,
      companiesLoading,
      linkedExperienceCompanyById,
      linkedExperienceIds,
      parseError,
      refineCompanyOptions,
      refining,
      selectedExperienceIds,
      validationError,
    ],
  );

  const footerApply = disabled
    ? null
    : (
        <>
          <button
            type="button"
            onClick={resetRefineForm}
            disabled={refining}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
          >
            {t("generate.generateStep.refine.reset")}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={refining}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {refining
              ? t("generate.generateStep.refine.applying")
              : t("generate.generateStep.refine.apply")}
          </button>
        </>
      );

  return { panel, footerApply, resetRefineForm };
}
