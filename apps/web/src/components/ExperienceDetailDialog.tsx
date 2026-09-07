"use client";

import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import type { ExperienceDetail } from "@/lib/api";

type ExperienceDetailDialogProps = {
  experience: ExperienceDetail;
  onClose: () => void;
};

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
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          Description
        </div>
        {experience.description ? (
          <AiVerdictMarkdown markdown={experience.description} />
        ) : (
          <div className="text-foreground">—</div>
        )}
      </div>
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
