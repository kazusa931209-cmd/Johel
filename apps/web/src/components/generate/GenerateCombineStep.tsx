"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompanyCards } from "@/components/generate/CombineCompanyCards";
import { CombineExperienceSuggest } from "@/components/generate/CombineExperienceSuggest";
import { CombineProfilePicker } from "@/components/generate/CombineProfilePicker";
import {
  type CombineCompanyEntry,
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
  const combineRef = useRef(combine);
  combineRef.current = combine;

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

  const flushCompanyContextRef = useRef<() => void>(() => {});

  const flushPendingCompanyContext = useCallback(() => {
    flushCompanyContextRef.current();
  }, []);

  const resolveCombineSnapshot = useCallback(() => {
    flushPendingCompanyContext();
    return combineRef.current;
  }, [flushPendingCompanyContext]);

  const handleRun = useCallback(() => {
    const snapshot = resolveCombineSnapshot();
    const errors = validateCombineSnapshot(snapshot, t, profileGraduation);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void onRunFromCombine();
  }, [profileGraduation, onRunFromCombine, resolveCombineSnapshot, t]);

  const runReady = isCombineRunReady(combine, profileGraduation);
  const showRunGuidance = combine.companies.some(
    (entry) => entry.experienceIds.length > 0,
  );

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
      const next = {
        ...current,
        profileId,
        companies: profileId === current.profileId ? current.companies : [],
      };
      combineRef.current = next;
      onCombineChange(next);
    },
    [onCombineChange],
  );

  const registerContextFlush = useCallback((flush: () => void) => {
    flushCompanyContextRef.current = flush;
  }, []);

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
      <p className="text-sm text-muted">{t("generate.combine.description")}</p>

      <CombineProfilePicker
        profileId={combine.profileId}
        onProfileIdChange={handleProfileIdChange}
        fieldErrors={fieldErrors}
        onClearError={clearProfileError}
      />

      <CombineCompanyCards
        companies={combine.companies}
        onChange={handleCompaniesChange}
        disabled={!combine.profileId}
        profileGraduation={profileGraduation}
        error={fieldErrors.companies}
        onClearError={clearCompaniesError}
        onRegisterContextFlush={registerContextFlush}
      />

      <CombineExperienceSuggest
        combine={combine}
        resolveCombineSnapshot={resolveCombineSnapshot}
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
          rows={4}
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
