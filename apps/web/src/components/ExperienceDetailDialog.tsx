"use client";

import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
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
      <DetailField label="Description" value={experience.description} />
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
