"use client";

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
}: {
  label: string;
  markdown: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </div>
      {markdown ? (
        <AiVerdictMarkdown markdown={markdown} />
      ) : (
        <div className="text-foreground">—</div>
      )}
    </div>
  );
}

export function ExperienceDetailDialog({
  experience,
  onClose,
}: ExperienceDetailDialogProps) {
  return (
    <DetailDialog
      title={experience.category || "Experience detail"}
      onClose={onClose}
    >
      <DetailField label="Category" value={experience.category} />
      <MarkdownField label="Problem" markdown={experience.problem} />
      <MarkdownField label="Actions" markdown={experience.actions} />
      <MarkdownField label="Outcome" markdown={experience.outcome} />
      <DetailField
        label="Created"
        value={new Date(experience.createdAt).toLocaleString()}
      />
      <DetailField
        label="Updated"
        value={new Date(experience.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
