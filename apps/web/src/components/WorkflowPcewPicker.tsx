"use client";

import { useCallback, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { PcewSection } from "@/components/generate/PcewSection";
import { ProfileDetailDialog } from "@/components/ProfileDetailDialog";
import { listProfiles, type ProfileDetail } from "@/lib/api";
import { fullName } from "@/lib/profile";
import type { WorkflowEditorFieldErrors } from "@/lib/workflow";

type WorkflowProfilePickerProps = {
  profileId: string;
  onProfileIdChange: (profileId: string) => void;
  fieldErrors?: WorkflowEditorFieldErrors;
  onClearError?: () => void;
};

export function WorkflowProfilePicker({
  profileId,
  onProfileIdChange,
  fieldErrors = {},
  onClearError,
}: WorkflowProfilePickerProps) {
  const t = useT();
  const [viewingProfile, setViewingProfile] = useState<ProfileDetail | null>(
    null,
  );

  const fetchProfiles = useCallback(() => listProfiles("", null), []);

  return (
    <PcewSection<ProfileDetail>
      title={t("crud.workflows.form.profile")}
      emptyLabel={t("crud.profiles.notFound")}
      error={fieldErrors.profileId}
      selectionMode="single"
      isSelected={(id) => profileId === id}
      onRowSelect={(id) => {
        onProfileIdChange(id);
        onClearError?.();
      }}
      fetchAll={fetchProfiles}
      loadErrorLabel={t("toast.profilesLoadFailed")}
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
          header: t("crud.profiles.form.pn"),
          className: "whitespace-nowrap text-muted",
          cell: (row) => row.pn ?? "",
        },
        {
          header: t("crud.profiles.form.education"),
          className: "max-w-[160px] truncate text-muted",
          cell: (row) => row.education ?? "",
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
