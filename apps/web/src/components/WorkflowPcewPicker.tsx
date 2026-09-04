"use client";

import { useCallback, useState } from "react";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import { PcewSection } from "@/components/generate/PcewSection";
import {
  type PcewContentFieldErrors,
  type PcewContentSelection,
} from "@/components/generate/pcew-types";
import { ProfileDetailDialog } from "@/components/ProfileDetailDialog";
import {
  listCompanies,
  listExperiences,
  listProfiles,
  type CompanyDetail,
  type ExperienceDetail,
  type ProfileDetail,
} from "@/lib/api";
import { formatMetadataCell as formatCompanyMetadata } from "@/lib/company";
import { formatMetadataCell as formatExperienceMetadata } from "@/lib/experience";
import { fullName } from "@/lib/profile";

type WorkflowPcewPickerProps = {
  selection: PcewContentSelection;
  onSelectionChange: (selection: PcewContentSelection) => void;
  fieldErrors?: PcewContentFieldErrors;
  onClearError?: (field: keyof PcewContentFieldErrors) => void;
};

export function WorkflowPcewPicker({
  selection,
  onSelectionChange,
  fieldErrors = {},
  onClearError,
}: WorkflowPcewPickerProps) {
  const [viewingProfile, setViewingProfile] = useState<ProfileDetail | null>(
    null,
  );
  const [viewingCompany, setViewingCompany] = useState<CompanyDetail | null>(
    null,
  );
  const [viewingExperience, setViewingExperience] =
    useState<ExperienceDetail | null>(null);

  const fetchProfiles = useCallback(() => listProfiles("", null), []);
  const fetchCompanies = useCallback(() => listCompanies("", null), []);
  const fetchExperiences = useCallback(() => listExperiences("", null), []);

  function clearError(field: keyof PcewContentFieldErrors) {
    onClearError?.(field);
  }

  function onProfileSelect(id: string) {
    onSelectionChange({ ...selection, profileId: id });
    clearError("profileId");
  }

  function onCompanySelect(id: string) {
    const next = selection.companyIds.includes(id)
      ? selection.companyIds.filter((item) => item !== id)
      : [...selection.companyIds, id];
    onSelectionChange({ ...selection, companyIds: next });
    if (next.length > 0) clearError("companyIds");
  }

  function onExperienceSelect(id: string) {
    const next = selection.experienceIds.includes(id)
      ? selection.experienceIds.filter((item) => item !== id)
      : [...selection.experienceIds, id];
    onSelectionChange({ ...selection, experienceIds: next });
    if (next.length > 0) clearError("experienceIds");
  }

  return (
    <div className="space-y-6">
      <PcewSection<ProfileDetail>
        title="Profile"
        emptyLabel="No profiles found."
        error={fieldErrors.profileId}
        selectionMode="single"
        isSelected={(id) => selection.profileId === id}
        onRowSelect={onProfileSelect}
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

      <PcewSection<CompanyDetail>
        title="Companies"
        emptyLabel="No companies found."
        error={fieldErrors.companyIds}
        selectionMode="multiple"
        isSelected={(id) => selection.companyIds.includes(id)}
        onRowSelect={onCompanySelect}
        fetchAll={fetchCompanies}
        loadErrorLabel="Failed to load companies"
        viewing={viewingCompany}
        onView={setViewingCompany}
        minWidthClass="min-w-[720px]"
        columns={[
          {
            header: "Company Name",
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            header: "Description",
            className: "max-w-[280px] truncate text-muted",
            cell: (row) => row.description,
          },
          {
            header: "Metadata",
            className: "max-w-[180px] truncate text-muted",
            cell: (row) => formatCompanyMetadata(row.metadata),
          },
          {
            header: "Priority",
            className: "whitespace-nowrap text-muted",
            cell: (row) => row.priority,
          },
        ]}
        renderDetailDialog={(row) => (
          <CompanyDetailDialog
            company={row}
            onClose={() => setViewingCompany(null)}
          />
        )}
      />

      <PcewSection<ExperienceDetail>
        title="Experiences"
        emptyLabel="No experiences found."
        error={fieldErrors.experienceIds}
        selectionMode="multiple"
        isSelected={(id) => selection.experienceIds.includes(id)}
        onRowSelect={onExperienceSelect}
        fetchAll={fetchExperiences}
        loadErrorLabel="Failed to load experiences"
        viewing={viewingExperience}
        onView={setViewingExperience}
        columns={[
          {
            header: "Category",
            cell: (row) => <span className="font-medium">{row.category}</span>,
          },
          {
            header: "Description",
            className: "max-w-[320px] truncate text-muted",
            cell: (row) => row.description,
          },
          {
            header: "Metadata",
            className: "max-w-[180px] truncate text-muted",
            cell: (row) => formatExperienceMetadata(row.metadata),
          },
        ]}
        renderDetailDialog={(row) => (
          <ExperienceDetailDialog
            experience={row}
            onClose={() => setViewingExperience(null)}
          />
        )}
      />
    </div>
  );
}
