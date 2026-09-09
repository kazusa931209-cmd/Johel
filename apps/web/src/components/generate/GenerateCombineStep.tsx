"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCards } from "@/components/generate/CombineCompanyCards";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  RUN_LANGUAGES,
  type CombineFieldErrors,
  type CombineSnapshot,
  type RunLanguage,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { getProfile } from "@/lib/api";

type GenerateCombineStepProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  onPrev: () => void;
  onNext: () => void | Promise<void>;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function GenerateCombineStep({
  combine,
  onCombineChange,
  onPrev,
  onNext,
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

  const handleNext = useCallback(() => {
    const errors = validateCombineSnapshot(combine, t, graduationYear);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onNext();
  }, [combine, graduationYear, onNext, t]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: handleNext,
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

      <label className="block max-w-xs space-y-1 text-sm">
        <span>{t("generate.combine.language")}</span>
        <div className="relative">
          <select
            value={combine.language}
            onChange={(e) =>
              patchCombine({ language: e.target.value as RunLanguage })
            }
            className="w-full appearance-none rounded-md border border-border bg-background py-2 pr-9 pl-3 outline-none focus:border-muted"
          >
            {RUN_LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
          />
        </div>
      </label>

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
