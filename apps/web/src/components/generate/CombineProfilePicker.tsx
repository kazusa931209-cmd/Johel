"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { PceSection } from "@/components/generate/PceSection";
import type { CombineFieldErrors } from "@/components/generate/combine-types";
import { ProfileDetailDialog } from "@/components/ProfileDetailDialog";
import type { ProfileDetail } from "@/lib/api";
import { fullName } from "@/lib/profile";
import { usePce } from "@/lib/pce";

type CombineProfilePickerProps = {
  profileId: string;
  onProfileIdChange: (profileId: string) => void;
  fieldErrors?: CombineFieldErrors;
  onClearError?: () => void;
};

export function CombineProfilePicker({
  profileId,
  onProfileIdChange,
  fieldErrors = {},
  onClearError,
}: CombineProfilePickerProps) {
  const t = useT();
  const { locale } = useLocale();
  const { toast } = useToast();
  const { profiles, loading, error } = usePce();
  const [viewingProfile, setViewingProfile] = useState<ProfileDetail | null>(
    null,
  );

  useEffect(() => {
    if (error) {
      toast(error ?? t("toast.profilesLoadFailed"), "error");
    }
  }, [error, t, toast]);

  return (
    <PceSection<ProfileDetail>
      title={t("generate.combine.profile")}
      emptyLabel={t("crud.profiles.notFound")}
      error={fieldErrors.profileId}
      selectionMode="single"
      isSelected={(id) => profileId === id}
      onRowSelect={(id) => {
        onProfileIdChange(id);
        onClearError?.();
      }}
      items={profiles}
      loading={loading}
      viewing={viewingProfile}
      onView={setViewingProfile}
      columns={[
        {
          header: t("crud.profiles.columns.fullName"),
          cell: (row) => (
            <span className="font-medium">
              {fullName(row.firstName, row.lastName)}
            </span>
          ),
        },
        {
          header: t("crud.profiles.form.email"),
          className: "max-w-[180px] truncate text-muted",
          cell: (row) => row.email ?? "",
        },
        {
          header: t("crud.profiles.form.university"),
          className: "max-w-[160px] truncate text-muted",
          cell: (row) => row.university ?? "",
        },
        {
          header: t("crud.profiles.form.graduation"),
          className: "whitespace-nowrap text-muted",
          cell: (row) => {
            if (row.graduationYear == null || row.graduationMonth == null) {
              return row.graduationYear != null ? String(row.graduationYear) : "";
            }
            return new Intl.DateTimeFormat(locale, {
              month: "short",
              year: "numeric",
            }).format(
              new Date(row.graduationYear, row.graduationMonth - 1, 1),
            );
          },
        },
      ]}
      renderDetailDialog={(row) => (
        <ProfileDetailDialog
          profile={row}
          onClose={() => setViewingProfile(null)}
        />
      )}
    />
  );
}
