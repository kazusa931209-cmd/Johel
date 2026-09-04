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
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          Metadata
        </div>
        {experience.metadata.length === 0 ? (
          <p className="text-muted">No metadata.</p>
        ) : (
          <ul className="space-y-2">
            {experience.metadata.map((item) => (
              <li
                key={item.key}
                className="rounded-md border border-border px-3 py-2"
              >
                <div className="font-medium">{item.key}</div>
                <div className="break-all text-muted">{item.value || "—"}</div>
              </li>
            ))}
          </ul>
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
