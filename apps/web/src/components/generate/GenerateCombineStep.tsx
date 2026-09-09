"use client";

import { useCallback, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { CombineCompaniesEditor } from "@/components/generate/CombineCompaniesEditor";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  RUN_LANGUAGES,
  type CombineFieldErrors,
  type CombineSnapshot,
  type RunLanguage,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { runAiCombineRecommend, type CombineRecommendMode } from "@/lib/api";
import { noiseFilter } from "@/lib/jobNoiseFilter";

type GenerateCombineStepProps = {
  combine: CombineSnapshot;
  jobText: string;
  acceptedMarkdown: string | null;
  doVerdict: boolean;
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
  jobText,
  acceptedMarkdown,
  doVerdict,
  onCombineChange,
  onPrev,
  onNext,
}: GenerateCombineStepProps) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [recommending, setRecommending] = useState(false);
  const [recommendMode, setRecommendMode] =
    useState<CombineRecommendMode>("guided");

  const handleNext = useCallback(() => {
    const errors = validateCombineSnapshot(combine, t);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onNext();
  }, [combine, onNext, t]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: handleNext,
  });

  function patchCombine(patch: Partial<CombineSnapshot>) {
    onCombineChange({ ...combine, ...patch });
  }

  const handleSuggest = useCallback(async () => {
    if (!combine.profileId) {
      setFieldErrors({ profileId: t("validation.profileRequired") });
      return;
    }
    if (combine.companies.length < 1) {
      setFieldErrors({ companies: t("validation.combineCompaniesRequired") });
      return;
    }

    const jobDescription = noiseFilter(jobText.trim()).text;
    if (!jobDescription) {
      toast(t("validation.jobDescriptionRequired"), "error");
      return;
    }

    setRecommending(true);
    const res = await runAiCombineRecommend({
      jobDescription,
      ...(doVerdict && acceptedMarkdown?.trim()
        ? { acceptedMarkdown: acceptedMarkdown.trim() }
        : {}),
      mode: recommendMode,
      profileId: combine.profileId,
      companies: combine.companies.map((entry) => ({
        companyId: entry.companyId,
        startDate: entry.startDate,
        endDate: entry.endDate,
        roleContext: entry.roleContext,
        experienceIds: entry.experienceIds,
      })),
    });
    setRecommending(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("toast.combineRecommendFailed"), "error");
      return;
    }

    const byCompanyId = new Map(
      res.data.companies.map((item) => [item.companyId, item.experienceIds]),
    );
    onCombineChange({
      ...combine,
      companies: combine.companies.map((entry) => ({
        ...entry,
        experienceIds:
          byCompanyId.get(entry.companyId) ?? entry.experienceIds,
      })),
    });

    for (const warning of res.data.warnings) {
      toast(warning, "warning");
    }

    setTokenUsed(res.data.tokenUsed);
    void refreshTokenUsed();
    toast(t("toast.combineRecommendReady"), "success");
  }, [
    acceptedMarkdown,
    combine,
    doVerdict,
    jobText,
    onCombineChange,
    recommendMode,
    refreshTokenUsed,
    setTokenUsed,
    t,
    toast,
  ]);

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
        onProfileIdChange={(profileId) => patchCombine({ profileId })}
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

      <CombineCompaniesEditor
        companies={combine.companies}
        onChange={(companies) => patchCombine({ companies })}
        error={fieldErrors.companies}
        onClearError={() =>
          setFieldErrors((errors) => ({ ...errors, companies: undefined }))
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block max-w-xs space-y-1 text-sm">
          <span>{t("generate.combine.suggestMode")}</span>
          <div className="relative">
            <select
              value={recommendMode}
              onChange={(e) =>
                setRecommendMode(e.target.value as CombineRecommendMode)
              }
              className="w-full appearance-none rounded-md border border-border bg-background py-2 pr-9 pl-3 outline-none focus:border-muted"
            >
              <option value="guided">{t("generate.combine.modeGuided")}</option>
              <option value="auto">{t("generate.combine.modeAuto")}</option>
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
            />
          </div>
          <p className="text-xs text-muted">
            {recommendMode === "guided"
              ? t("generate.combine.modeGuidedHint")
              : t("generate.combine.modeAutoHint")}
          </p>
        </label>
        <button
          type="button"
          onClick={() => void handleSuggest()}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-60"
        >
          {recommending
            ? t("generate.combine.suggesting")
            : t("generate.combine.suggestExperiences")}
        </button>
      </div>

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

      {recommending ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.combine.suggesting")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
