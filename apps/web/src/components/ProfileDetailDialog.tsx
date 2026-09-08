"use client";

import { useT } from "@/components/app/LocaleProvider";
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
  const t = useT();

  return (
    <DetailDialog
      title={
        fullName(profile.firstName, profile.lastName) ||
        t("crud.profiles.detailTitle")
      }
      onClose={onClose}
    >
      <DetailField
        label={t("crud.profiles.form.firstName")}
        value={profile.firstName}
      />
      <DetailField
        label={t("crud.profiles.form.lastName")}
        value={profile.lastName}
      />
      <DetailField
        label={t("crud.profiles.form.birthDate")}
        value={profile.birthDate}
      />
      <DetailField label={t("crud.profiles.form.email")} value={profile.email} />
      <DetailField label={t("crud.profiles.form.pn")} value={profile.pn} />
      <DetailField
        label={t("crud.profiles.form.residence")}
        value={profile.residence}
      />
      <DetailField
        label={t("crud.profiles.form.education")}
        value={profile.education}
      />
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("crud.profiles.links.title")}
        </div>
        {profile.links.length === 0 ? (
          <p className="text-muted">{t("crud.profiles.noLinks")}</p>
        ) : (
          <ul className="space-y-2">
            {profile.links.map((item) => (
              <li
                key={item.key}
                className="rounded-md border border-border px-3 py-2"
              >
                <div className="font-medium">{item.key}</div>
                <div className="break-all text-muted">
                  {item.link || t("crud.common.emDash")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <DetailField
        label={t("crud.common.created")}
        value={new Date(profile.createdAt).toLocaleString()}
      />
      <DetailField
        label={t("crud.common.updated")}
        value={new Date(profile.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
