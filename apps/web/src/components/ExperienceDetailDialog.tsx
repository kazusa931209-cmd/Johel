"use client";

import { useT } from "@/components/app/LocaleProvider";
import { SplitButton } from "@/components/shared/action-icon-buttons";
import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { ExperienceDensityIndicator } from "@/components/ExperienceDensityIndicator";
import { isDenseExperience } from "@/lib/experience-density";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { Drawer } from "@/components/shared/drawer";
import type { ExperienceDetail } from "@/lib/api";

type ExperienceDetailDialogProps = {
  experience: ExperienceDetail;
  onClose: () => void;
  onSplit?: () => void;
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

function ExperienceDetailFields({ experience }: { experience: ExperienceDetail }) {
  const t = useT();

  return (
    <>
      <DetailField
        label={t("crud.experiences.columns.category")}
        value={experience.category}
      />
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("crud.experiences.columns.density")}
        </div>
        <ExperienceDensityIndicator
          fields={{
            problem: experience.problem,
            actions: experience.actions,
            outcome: experience.outcome,
          }}
          isDense={experience.isDense}
        />
      </div>
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
    </>
  );
}

export function ExperienceDetailDialog({
  experience,
  onClose,
  onSplit,
}: ExperienceDetailDialogProps) {
  const t = useT();
  const dense =
    experience.isDense ??
    isDenseExperience({
      problem: experience.problem,
      actions: experience.actions,
      outcome: experience.outcome,
    });

  return (
    <DetailDialog
      title={experience.category || t("crud.experiences.detailTitle")}
      onClose={onClose}
    >
      <ExperienceDetailFields experience={experience} />
      {onSplit && dense ? (
        <div className="flex justify-end border-t border-border pt-4">
          <SplitButton showLabel onClick={onSplit} />
        </div>
      ) : null}
    </DetailDialog>
  );
}

type ExperienceDetailDrawerProps = {
  experience: ExperienceDetail | null;
  open: boolean;
  onClose: () => void;
};

export function ExperienceDetailDrawer({
  experience,
  open,
  onClose,
}: ExperienceDetailDrawerProps) {
  const t = useT();

  return (
    <Drawer
      title={
        experience?.category || t("crud.experiences.detailTitle")
      }
      open={open}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {experience ? (
          <div className="space-y-4">
            <ExperienceDetailFields experience={experience} />
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
