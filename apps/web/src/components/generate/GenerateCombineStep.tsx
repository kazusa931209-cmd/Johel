"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCards } from "@/components/generate/CombineCompanyCards";
import { CombineExperienceSuggest } from "@/components/generate/CombineExperienceSuggest";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  type CombineFieldErrors,
  type CombineSnapshot,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { getProfile } from "@/lib/api";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateCombineStepProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  doVerdict: boolean;
  generationId?: string | null;
  onRunFromCombine: () => void | Promise<void>;
};

export function GenerateCombineStep({
  combine,
  onCombineChange,
  job,
  doVerdict,
  generationId,
  onRunFromCombine,
}: GenerateCombineStepProps) {
  const t = useT();
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [graduationYear, setGraduationYear] = useState<number | null>(null);

  useEffect(() => {
    if (!combine.profileId) {
      setGraduationYear(null);
      return;
    }

    let cancelled = false;
    getProfile(combine.profileId).then((res) => {
      if (cancelled) return;
      setGraduationYear(res.data?.graduationYear ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [combine.profileId]);

  const handleRun = useCallback(() => {
    const errors = validateCombineSnapshot(combine, t, graduationYear);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onRunFromCombine();
  }, [combine, graduationYear, onRunFromCombine, t]);

  useRegisterGenerateStepNav({
    onRun: handleRun,
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
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("generate.combine.title")}
        </h2>
        <p className="text-sm text-muted">{t("generate.combine.description")}</p>
      </div>

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
        graduationYear={graduationYear}
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
        graduationYear={graduationYear}
        generationId={generationId}
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
    </div>
  );
}
