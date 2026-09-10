"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCards } from "@/components/generate/CombineCompanyCards";
import { CombineExperienceSuggest } from "@/components/generate/CombineExperienceSuggest";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  isCombineRunReady,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import type { GenerateJobState } from "@/lib/generate-session";
import { usePce } from "@/lib/pce";
import { sanitizeCombineSelection } from "@/lib/combine-defaults";
import { resolveProfileGraduation } from "@/lib/profile";

type GenerateCombineStepProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  generationId?: string | null;
  onSaveBeforeSuggest: () => Promise<{ error?: string }>;
  onRunFromCombine: () => void | Promise<void>;
};

export function GenerateCombineStep({
  combine,
  onCombineChange,
  job,
  doVerdict,
  generationId,
  onSaveBeforeSuggest,
  onRunFromCombine,
}: GenerateCombineStepProps) {
  const t = useT();
  const { profiles, companies: workspaceCompanies, loading: pceLoading } =
    usePce();
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});

  useEffect(() => {
    if (pceLoading) return;
    const sanitized = sanitizeCombineSelection(
      combine,
      new Set(profiles.map((profile) => profile.id)),
      new Set(workspaceCompanies.map((company) => company.id)),
    );
    if (sanitized) {
      onCombineChange(sanitized);
    }
  }, [
    combine,
    onCombineChange,
    pceLoading,
    profiles,
    workspaceCompanies,
  ]);

  const profileGraduation = useMemo(() => {
    if (!combine.profileId) return null;
    const profile = profiles.find((item) => item.id === combine.profileId);
    return resolveProfileGraduation(profile);
  }, [combine.profileId, profiles]);

  const handleRun = useCallback(() => {
    const errors = validateCombineSnapshot(combine, t, profileGraduation);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onRunFromCombine();
  }, [combine, profileGraduation, onRunFromCombine, t]);

  const runReady = isCombineRunReady(combine, profileGraduation);
  const showRunGuidance = combine.companies.some(
    (entry) => entry.experienceIds.length > 0,
  );

  useRegisterGenerateStepNav({
    onRun: handleRun,
    runDisabled: !runReady,
  });

  function patchCombine(patch: Partial<CombineSnapshot>) {
    onCombineChange({ ...combine, ...patch });
  }

  function handleProfileIdChange(profileId: string) {
    onCombineChange({
      ...combine,
      profileId,
      companies: profileId === combine.profileId ? combine.companies : [],
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("generate.combine.description")}</p>

      <CombineProfilePicker
        profileId={combine.profileId}
        onProfileIdChange={handleProfileIdChange}
        fieldErrors={fieldErrors}
        onClearError={() =>
          setFieldErrors((errors) => ({ ...errors, profileId: undefined }))
        }
      />

      <CombineCompanyCards
        companies={combine.companies}
        onChange={(companies) => patchCombine({ companies })}
        disabled={!combine.profileId}
        profileGraduation={profileGraduation}
        error={fieldErrors.companies}
        onClearError={() =>
          setFieldErrors((errors) => ({ ...errors, companies: undefined }))
        }
      />

      <CombineExperienceSuggest
        combine={combine}
        onCombineChange={onCombineChange}
        job={job}
        doVerdict={doVerdict}
        profileGraduation={profileGraduation}
        generationId={generationId}
        onSaveBeforeSuggest={onSaveBeforeSuggest}
      />

      <label className="block space-y-1 text-sm">
        <span>{t("generate.combine.emphasis")}</span>
        <p className="text-xs text-muted">{t("generate.combine.emphasisHint")}</p>
        <textarea
          value={combine.emphasis}
          onChange={(e) => patchCombine({ emphasis: e.target.value })}
          rows={8}
          placeholder={t("generate.combine.emphasisPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
      </label>

      {showRunGuidance ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-toast-success-bg px-3 py-3 text-sm text-toast-success-fg"
        >
          {t("generate.combine.suggestRunGuidance")}
        </div>
      ) : null}
    </div>
  );
}
