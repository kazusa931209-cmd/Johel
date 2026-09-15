"use client";

import { useT } from "@/components/app/LocaleProvider";
import { formatThousandsSeparated } from "@/lib/helper";
import {
  EXPERIENCE_DENSITY_LIMITS,
  getExperienceDensityStatus,
  type ExperienceDensityFields,
} from "@/lib/experience-density";

type ExperienceDensityIndicatorProps = {
  fields: ExperienceDensityFields;
  isDense?: boolean;
};

function DensityCount({
  label,
  count,
  overLimit,
  title,
}: {
  label: string;
  count: number;
  overLimit: boolean;
  title: string;
}) {
  return (
    <span
      title={title}
      className={`tabular-nums ${overLimit ? "font-medium text-danger" : "text-muted"}`}
    >
      <span className="text-[0.65rem] font-medium tracking-wide uppercase">
        {label}
      </span>{" "}
      {formatThousandsSeparated(count)}
    </span>
  );
}

export function ExperienceDensityIndicator({
  fields,
  isDense,
}: ExperienceDensityIndicatorProps) {
  const t = useT();
  const status = getExperienceDensityStatus(fields);
  const dense = isDense ?? status.isDense;
  const limits = EXPERIENCE_DENSITY_LIMITS;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <div className="flex items-center gap-1.5">
        <DensityCount
          label={t("crud.experiences.split.densityProblemShort")}
          count={status.counts.problem}
          overLimit={status.exceeded.problem}
          title={t("crud.experiences.split.densityProblemHint", {
            limit: formatThousandsSeparated(limits.problem),
          })}
        />
        <DensityCount
          label={t("crud.experiences.split.densityActionsShort")}
          count={status.counts.actions}
          overLimit={status.exceeded.actions}
          title={t("crud.experiences.split.densityActionsHint", {
            limit: formatThousandsSeparated(limits.actions),
          })}
        />
        <DensityCount
          label={t("crud.experiences.split.densityOutcomeShort")}
          count={status.counts.outcome}
          overLimit={status.exceeded.outcome}
          title={t("crud.experiences.split.densityOutcomeHint", {
            limit: formatThousandsSeparated(limits.outcome),
          })}
        />
        <DensityCount
          label={t("crud.experiences.split.densityTotalShort")}
          count={status.counts.total}
          overLimit={status.exceeded.total}
          title={t("crud.experiences.split.densityTotalHint", {
            limit: formatThousandsSeparated(limits.total),
          })}
        />
      </div>
      {dense ? (
        <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs font-normal text-muted">
          {t("crud.experiences.split.denseBadge")}
        </span>
      ) : null}
    </div>
  );
}
