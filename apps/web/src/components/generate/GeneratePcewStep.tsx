"use client";

import { useCallback, useState } from "react";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import { PcewSection } from "@/components/generate/PcewSection";
import {
  type PcewFieldErrors,
  type PcewSelection,
  validatePcewSelection,
} from "@/components/generate/pcew-types";
import { ProfileDetailDialog } from "@/components/ProfileDetailDialog";
import { WorkflowDetailDialog } from "@/components/WorkflowDetailDialog";
import {
  listCompanies,
  listExperiences,
  listProfiles,
  listWorkflows,
  type CompanyDetail,
  type ExperienceDetail,
  type ProfileDetail,
  type Workflow,
} from "@/lib/api";
import { formatMetadataCell as formatCompanyMetadata } from "@/lib/company";
import { formatMetadataCell as formatExperienceMetadata } from "@/lib/experience";
import { formatLinksCell, fullName } from "@/lib/profile";

type GeneratePcewStepProps = {
  selection: PcewSelection;
  onSelectionChange: (selection: PcewSelection) => void;
  onPrev: () => void;
  onNext: () => void;
};

function formatWorkflowDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function GeneratePcewStep({
  selection,
  onSelectionChange,
  onPrev,
  onNext,
}: GeneratePcewStepProps) {
  const [fieldErrors, setFieldErrors] = useState<PcewFieldErrors>({});
  const [viewingProfile, setViewingProfile] = useState<ProfileDetail | null>(
    null,
  );
  const [viewingCompany, setViewingCompany] = useState<CompanyDetail | null>(
    null,
  );
  const [viewingExperience, setViewingExperience] =
    useState<ExperienceDetail | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);

  const fetchProfiles = useCallback(
    (q: string, page: number) => listProfiles(q, page),
    [],
  );
  const fetchCompanies = useCallback(
    (q: string, page: number) => listCompanies(q, page),
    [],
  );
  const fetchExperiences = useCallback(
    (q: string, page: number) => listExperiences(q, page),
    [],
  );
  const fetchWorkflows = useCallback(
    (q: string, page: number) => listWorkflows(q, page),
    [],
  );

  function clearError(field: keyof PcewFieldErrors) {
    if (!fieldErrors[field]) return;
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
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

  function onWorkflowSelect(id: string) {
    onSelectionChange({ ...selection, workflowId: id });
    clearError("workflowId");
  }

  function handleNext() {
    const errors = validatePcewSelection(selection);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">PCEW</h2>
        <p className="text-sm text-muted">
          Choose one profile, one or more companies, one or more experiences,
          and one workflow.
        </p>
      </div>

      <PcewSection<ProfileDetail>
        title="Profile"
        searchPlaceholder="Search name, email, PN, residence, education"
        emptyLabel="No profiles found."
        error={fieldErrors.profileId}
        selectionMode="single"
        isSelected={(id) => selection.profileId === id}
        onRowSelect={onProfileSelect}
        fetchPage={fetchProfiles}
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
        searchPlaceholder="Search name, description"
        emptyLabel="No companies found."
        error={fieldErrors.companyIds}
        selectionMode="multiple"
        isSelected={(id) => selection.companyIds.includes(id)}
        onRowSelect={onCompanySelect}
        fetchPage={fetchCompanies}
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
        searchPlaceholder="Search category, description"
        emptyLabel="No experiences found."
        error={fieldErrors.experienceIds}
        selectionMode="multiple"
        isSelected={(id) => selection.experienceIds.includes(id)}
        onRowSelect={onExperienceSelect}
        fetchPage={fetchExperiences}
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

      <PcewSection<Workflow>
        title="Workflow"
        searchPlaceholder="Search name or description"
        emptyLabel="No workflows found."
        error={fieldErrors.workflowId}
        selectionMode="single"
        isSelected={(id) => selection.workflowId === id}
        onRowSelect={onWorkflowSelect}
        fetchPage={fetchWorkflows}
        loadErrorLabel="Failed to load workflows"
        viewing={viewingWorkflow}
        onView={setViewingWorkflow}
        minWidthClass="min-w-[720px]"
        columns={[
          {
            header: "Name",
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            header: "Description",
            className: "max-w-[220px] truncate text-muted",
            cell: (row) => row.description ?? "",
          },
          {
            header: "Used",
            cell: (row) => row.used,
          },
          {
            header: "Created",
            className: "whitespace-nowrap text-muted",
            cell: (row) => formatWorkflowDate(row.createdAt),
          },
          {
            header: "Updated",
            className: "whitespace-nowrap text-muted",
            cell: (row) => formatWorkflowDate(row.updatedAt),
          },
        ]}
        renderDetailDialog={(row) => (
          <WorkflowDetailDialog
            workflowId={row.id}
            onClose={() => setViewingWorkflow(null)}
          />
        )}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  );
}
