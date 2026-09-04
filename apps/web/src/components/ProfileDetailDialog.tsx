"use client";

import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import type { ProfileDetail } from "@/lib/api";
import { fullName } from "@/lib/profile";

type ProfileDetailDialogProps = {
  profile: ProfileDetail;
  onClose: () => void;
};

export function ProfileDetailDialog({
  profile,
  onClose,
}: ProfileDetailDialogProps) {
  return (
    <DetailDialog
      title={fullName(profile.firstName, profile.lastName) || "Profile detail"}
      onClose={onClose}
    >
      <DetailField label="First Name" value={profile.firstName} />
      <DetailField label="Last Name" value={profile.lastName} />
      <DetailField label="Birth date" value={profile.birthDate} />
      <DetailField label="Email" value={profile.email} />
      <DetailField label="PN" value={profile.pn} />
      <DetailField label="Residence" value={profile.residence} />
      <DetailField label="Education" value={profile.education} />
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          Links
        </div>
        {profile.links.length === 0 ? (
          <p className="text-muted">No links.</p>
        ) : (
          <ul className="space-y-2">
            {profile.links.map((item) => (
              <li
                key={item.key}
                className="rounded-md border border-border px-3 py-2"
              >
                <div className="font-medium">{item.key}</div>
                <div className="break-all text-muted">{item.link || "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <DetailField
        label="Created"
        value={new Date(profile.createdAt).toLocaleString()}
      />
      <DetailField
        label="Updated"
        value={new Date(profile.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
