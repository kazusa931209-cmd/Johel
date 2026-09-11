"use client";

import { useMemo } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  formatPeriodDurationYmLabel,
  sumCombineCompaniesPeriodMonths,
} from "@/lib/combine-period-display";
import { usePce } from "@/lib/pce";
import { resolveProfileGraduation } from "@/lib/profile";

type CombineTotalTenureHeaderProps = {
  combine: CombineSnapshot;
};

export function CombineTotalTenureHeader({
  combine,
}: CombineTotalTenureHeaderProps) {
  const t = useT();
  const { locale } = useLocale();
  const { profiles } = usePce();

  const totalMonths = useMemo(() => {
    const profile = profiles.find((item) => item.id === combine.profileId);
    const graduation = resolveProfileGraduation(profile);
    return sumCombineCompaniesPeriodMonths(
      combine.companies,
      graduation,
      locale,
    );
  }, [combine.companies, combine.profileId, locale, profiles]);

  if (totalMonths == null) return null;

  return (
    <div
      className="flex items-baseline gap-1.5 text-sm"
      aria-label={t("generate.combine.totalTenureAria", {
        duration: formatPeriodDurationYmLabel(totalMonths),
      })}
    >
      <span className="text-muted">{t("generate.combine.totalTenureLabel")}</span>
      <span className="font-mono font-medium">
        {formatPeriodDurationYmLabel(totalMonths)}
      </span>
    </div>
  );
}
