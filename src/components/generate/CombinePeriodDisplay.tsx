"use client";

import { useLocale, useT } from "@/components/app/LocaleProvider";
import { resolveCompanyPeriodDisplayParts } from "@/lib/combine-period-display";
import type { ProfileGraduation } from "@/lib/profile";

export function CombinePeriodDisplay({
  startDate,
  endDate,
  profileGraduation,
  className,
}: {
  startDate: string;
  endDate: string;
  profileGraduation: ProfileGraduation | null;
  className?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const { range, durationShort } = resolveCompanyPeriodDisplayParts(
    startDate,
    endDate,
    profileGraduation,
    locale,
    t,
  );

  return (
    <span className={className}>
      <span className="text-foreground">{range}</span>
      {durationShort ? (
        <span className="font-normal text-muted"> ({durationShort})</span>
      ) : null}
    </span>
  );
}
