"use client";

import { useT } from "@/components/app/LocaleProvider";
import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import type { ExperienceDetail } from "@/lib/api";

type ExperienceDetailDialogProps = {
  experience: ExperienceDetail;
  onClose: () => void;
};

function MarkdownField({
  label,
  markdown,
  emDash,
}: {
  label: string;
  markdown: string;
  emDash: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </div>
      {markdown ? (
        <AiVerdictMarkdown markdown={markdown} />
      ) : (
        <div className="text-foreground">{emDash}</div>
      )}
    </div>
  );
}

export function ExperienceDetailDialog({
  experience,
  onClose,
}: ExperienceDetailDialogProps) {
  const t = useT();

  return (
    <DetailDialog
      title={experience.category || t("crud.experiences.detailTitle")}
      onClose={onClose}
    >
      <DetailField
        label={t("crud.experiences.columns.category")}
        value={experience.category}
      />
      <MarkdownField
        label={t("crud.experiences.columns.problem")}
        markdown={experience.problem}
        emDash={t("crud.common.emDash")}
      />
      <MarkdownField
        label={t("crud.experiences.columns.actions")}
        markdown={experience.actions}
        emDash={t("crud.common.emDash")}
      />
      <MarkdownField
        label={t("crud.experiences.columns.outcome")}
        markdown={experience.outcome}
        emDash={t("crud.common.emDash")}
      />
      <DetailField
        label={t("crud.common.created")}
        value={new Date(experience.createdAt).toLocaleString()}
      />
      <DetailField
        label={t("crud.common.updated")}
        value={new Date(experience.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
