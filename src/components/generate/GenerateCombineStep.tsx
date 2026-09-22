"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCards } from "@/components/generate/CombineCompanyCards";
import type { CombineEmphasisFlushResult } from "@/components/generate/CombineEmphasisField";
import { CombineEmphasisField } from "@/components/generate/CombineEmphasisField";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  type CombineCompanyEntry,
  type CombineFieldErrors,
  type CombineSnapshot,
  isCombineRunReady,
  validateCombineSnapshot,
} from "@/components/generate/combine-types";
import { GenerateJdMetaFields } from "@/components/generate/GenerateJdMetaFields";
import {
  validateGenerateJdMetaFields,
  type GenerateJdMetaFieldErrors,
} from "@/lib/jd-meta-validation";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import type { GeneralResumeUserInstructionFlushResult } from "@/components/generate/GeneralResumeUserInstructionPanel";
import type { GenerateJobState } from "@/lib/generate-session";
import { usePce } from "@/lib/pce";
import {
  countRemovedExperienceLinks,
  sanitizeCombineSelection,
} from "@/lib/combine-defaults";
import { useToast } from "@/components/app/ToastProvider";
import { reclampCombineCompanyPeriods } from "@/lib/combine-period";
import { resolveProfileGraduation } from "@/lib/profile";

type GenerateCombineStepProps = {
  combine: CombineSnapshot;
  onCombineChange: (combine: CombineSnapshot) => void;
  job: GenerateJobState;
  onJobChange: (job: GenerateJobState) => void;
  doVerdict: boolean;
  generationId?: string | null;
  onSaveBeforeSuggest: (
    snapshot: CombineSnapshot,
  ) => Promise<{ error?: string }>;
  onRunFromCombine: () => void | Promise<void>;
  variant?: "jd" | "general";
  flushUserInstruction?: () => GeneralResumeUserInstructionFlushResult | null;
};

export function GenerateCombineStep({
  combine,
  onCombineChange,
  job,
  onJobChange,
  doVerdict,
  generationId,
  onSaveBeforeSuggest,
  onRunFromCombine,
  variant = "jd",
  flushUserInstruction,
}: GenerateCombineStepProps) {
  const t = useT();
  const { toast } = useToast();
  const { locale } = useLocale();
  const {
    profiles,
    companies: workspaceCompanies,
    experiences: workspaceExperiences,
    loading: pceLoading,
  } = usePce();
  const [fieldErrors, setFieldErrors] = useState<CombineFieldErrors>({});
  const [jdMetaErrors, setJdMetaErrors] = useState<GenerateJdMetaFieldErrors>(
    {},
  );
  const combineRef = useRef(combine);
  combineRef.current = combine;

  useEffect(() => {
    if (pceLoading) return;
    const sanitized = sanitizeCombineSelection(
      combine,
      new Set(profiles.map((profile) => profile.id)),
      new Set(workspaceCompanies.map((company) => company.id)),
      new Set(workspaceExperiences.map((experience) => experience.id)),
    );
    if (sanitized) {
      const removedLinks = countRemovedExperienceLinks(combine, sanitized);
      onCombineChange(sanitized);
      if (removedLinks > 0) {
        toast(t("toast.experienceArchivedLinkRemoved"), "warning");
      }
    }
  }, [
    combine,
    onCombineChange,
    pceLoading,
    profiles,
    workspaceCompanies,
    workspaceExperiences,
    toast,
    t,
  ]);

  useEffect(() => {
    if (pceLoading || combine.profileId || profiles.length < 1) {
      return;
    }
    onCombineChange({
      ...combineRef.current,
      profileId: profiles[0].id,
    });
  }, [combine.profileId, onCombineChange, pceLoading, profiles]);

  const profileGraduation = useMemo(() => {
    if (!combine.profileId) return null;
    const profile = profiles.find((item) => item.id === combine.profileId);
    return resolveProfileGraduation(profile);
  }, [combine.profileId, profiles]);

  const flushCompanyContextRef = useRef<() => void>(() => {});
  const flushEmphasisRef = useRef<() => CombineEmphasisFlushResult | null>(
    () => null,
  );

  const flushPendingFields = useCallback(() => {
    flushCompanyContextRef.current();
    const emphasisResult =
      variant === "jd" ? flushEmphasisRef.current() : null;
    const userInstructionResult = flushUserInstruction?.() ?? null;
    let next = combineRef.current;
    if (emphasisResult) {
      next = { ...next, emphasis: emphasisResult.emphasis };
    }
    if (userInstructionResult) {
      next = {
        ...next,
        userInstruction: userInstructionResult.userInstruction,
        platform: userInstructionResult.platform,
      };
    }
    if (emphasisResult || userInstructionResult) {
      combineRef.current = next;
      onCombineChange(next);
    }
  }, [flushUserInstruction, onCombineChange, variant]);

  const resolveCombineSnapshot = useCallback(() => {
    flushPendingFields();
    return combineRef.current;
  }, [flushPendingFields]);

  const handleRun = useCallback(() => {
    if (variant === "jd" && !doVerdict) {
      const metaErrors = validateGenerateJdMetaFields(
        job.jdCompanyName,
        job.jdJobRole,
        t,
      );
      if (Object.keys(metaErrors).length > 0) {
        setJdMetaErrors(metaErrors);
        return;
      }
      setJdMetaErrors({});
    }

    const snapshot = resolveCombineSnapshot();
    const errors = validateCombineSnapshot(snapshot, t, profileGraduation);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onRunFromCombine();
  }, [
    doVerdict,
    job.jdCompanyName,
    job.jdJobRole,
    onRunFromCombine,
    profileGraduation,
    resolveCombineSnapshot,
    t,
    variant,
  ]);

  const runReady = isCombineRunReady(combine, profileGraduation);

  useRegisterGenerateStepNav({
    onRun: handleRun,
    runDisabled: !runReady,
  });

  const patchCombine = useCallback(
    (patch: Partial<CombineSnapshot>) => {
      const next = { ...combineRef.current, ...patch };
      combineRef.current = next;
      onCombineChange(next);
    },
    [onCombineChange],
  );

  const handleProfileIdChange = useCallback(
    (profileId: string) => {
      const current = combineRef.current;
      if (profileId === current.profileId) {
        return;
      }

      const graduation = resolveProfileGraduation(
        profiles.find((profile) => profile.id === profileId),
      );
      const companies =
        graduation != null && current.companies.length > 0
          ? reclampCombineCompanyPeriods(
              current.companies,
              graduation,
              locale,
            )
          : current.companies;

      const next = {
        ...current,
        profileId,
        companies,
      };
      combineRef.current = next;
      onCombineChange(next);
    },
    [locale, onCombineChange, profiles],
  );

  const registerContextFlush = useCallback((flush: () => void) => {
    flushCompanyContextRef.current = flush;
  }, []);

  const registerEmphasisFlush = useCallback(
    (flush: () => CombineEmphasisFlushResult | null) => {
      flushEmphasisRef.current = flush;
    },
    [],
  );

  const handleCompaniesChange = useCallback(
    (companies: CombineCompanyEntry[]) => {
      patchCombine({ companies });
    },
    [patchCombine],
  );

  const clearProfileError = useCallback(() => {
    setFieldErrors((errors) => ({ ...errors, profileId: undefined }));
  }, []);

  const clearCompaniesError = useCallback(() => {
    setFieldErrors((errors) => ({ ...errors, companies: undefined }));
  }, []);

  return (
    <div className="space-y-6">
      {variant === "jd" && !doVerdict ? (
        <GenerateJdMetaFields
          jdCompanyName={job.jdCompanyName}
          jdJobRole={job.jdJobRole}
          onChange={(patch) => {
            onJobChange({ ...job, ...patch });
            if (jdMetaErrors.jdCompanyName && patch.jdCompanyName?.trim()) {
              setJdMetaErrors((current) => ({
                ...current,
                jdCompanyName: undefined,
              }));
            }
            if (jdMetaErrors.jdJobRole && patch.jdJobRole?.trim()) {
              setJdMetaErrors((current) => ({
                ...current,
                jdJobRole: undefined,
              }));
            }
          }}
          errors={jdMetaErrors}
        />
      ) : null}

      <p className="text-sm text-muted">
        {variant === "general"
          ? t("resumeBuilder.combine.description")
          : t("generate.combine.description")}
      </p>

      <CombineProfilePicker
        profileId={combine.profileId}
        onProfileIdChange={handleProfileIdChange}
        fieldErrors={fieldErrors}
        onClearError={clearProfileError}
      />

      <CombineCompanyCards
        combine={combine}
        resolveCombineSnapshot={resolveCombineSnapshot}
        onCombineChange={onCombineChange}
        job={job}
        doVerdict={doVerdict}
        generationId={generationId}
        onSaveBeforeSuggest={onSaveBeforeSuggest}
        companies={combine.companies}
        onChange={handleCompaniesChange}
        disabled={!combine.profileId}
        profileGraduation={profileGraduation}
        error={fieldErrors.companies}
        onClearError={clearCompaniesError}
        onRegisterContextFlush={registerContextFlush}
        suggestVariant={variant}
      />

      {variant === "jd" ? (
        <CombineEmphasisField
          emphasis={combine.emphasis}
          onEmphasisChange={(emphasis) => patchCombine({ emphasis })}
          onRegisterFlush={registerEmphasisFlush}
        />
      ) : null}
    </div>
  );
}
