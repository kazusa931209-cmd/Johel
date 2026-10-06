"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombineCompaniesReadOnlySection } from "@/components/generate/CombineCompaniesReadOnlySection";
import {
  RUN_LANGUAGES,
  type CombineSnapshot,
} from "@/components/generate/combine-types";
import { fullName } from "@/lib/profile";
import { usePce } from "@/lib/pce";

type GenerateCombineSummaryProps = {
  combine: CombineSnapshot;
};

function languageLabel(language: string): string {
  return (
    RUN_LANGUAGES.find((option) => option.value === language)?.label ?? language
  );
}

export function GenerateCombineSummary({
  combine,
}: GenerateCombineSummaryProps) {
  const t = useT();
  const { profiles, loading } = usePce();

  const profileName = useMemo(() => {
    const profile = profiles.find((item) => item.id === combine.profileId);
    return profile ? fullName(profile.firstName, profile.lastName) : null;
  }, [combine.profileId, profiles]);

  if (loading) {
    return <p className="text-sm text-muted">{t("shared.detail.loading")}</p>;
  }

  return (
    <div className="space-y-4 text-sm">
    <dl className="space-y-4">
      <div className="space-y-1">
        <dt className="font-medium">{t("generate.combine.profile")}</dt>
        <dd className="text-muted">
          {profileName ?? t("generate.previous.combineProfileMissing")}
        </dd>
      </div>

      <div className="space-y-1">
        <dt className="font-medium">{t("generate.combine.language")}</dt>
        <dd className="text-muted">{languageLabel(combine.language)}</dd>
      </div>

      {combine.platform.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">
            {t("resumeBuilder.combine.platformLabel")}
          </dt>
          <dd className="font-mono text-muted">{combine.platform}</dd>
        </div>
      ) : null}

      {combine.userInstruction.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">
            {t("resumeBuilder.combine.userInstructionFieldLabel")}
          </dt>
          <dd className="whitespace-pre-wrap font-mono text-muted">
            {combine.userInstruction}
          </dd>
        </div>
      ) : null}

      {combine.emphasis.trim() ? (
        <div className="space-y-1">
          <dt className="font-medium">{t("generate.combine.emphasis")}</dt>
          <dd className="whitespace-pre-wrap font-mono text-muted">
            {combine.emphasis}
          </dd>
        </div>
      ) : null}
    </dl>

      <CombineCompaniesReadOnlySection combine={combine} />
    </div>
  );
}
