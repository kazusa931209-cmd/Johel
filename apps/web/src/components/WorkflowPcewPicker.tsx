"use client";

import { useCallback, useState } from "react";
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
  const [viewingProfile, setViewingProfile] = useState<ProfileDetail | null>(
    null,
  );

  const fetchProfiles = useCallback(() => listProfiles("", null), []);

  return (
    <PcewSection<ProfileDetail>
      title="Profile"
      emptyLabel="No profiles found."
      error={fieldErrors.profileId}
      selectionMode="single"
      isSelected={(id) => profileId === id}
      onRowSelect={(id) => {
        onProfileIdChange(id);
        onClearError?.();
      }}
      fetchAll={fetchProfiles}
      loadErrorLabel="Failed to load profiles"
      viewing={viewingProfile}
      onView={setViewingProfile}
      columns={[
        {
          header: "Full Name",
          cell: (row) => (
            <span className="font-medium">
              {fullName(row.firstName, row.lastName)}
            </span>
          ),
        },
        {
          header: "Email",
          className: "max-w-[180px] truncate text-muted",
          cell: (row) => row.email ?? "",
        },
        {
          header: "PN",
          className: "whitespace-nowrap text-muted",
          cell: (row) => row.pn ?? "",
        },
        {
          header: "Education",
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
