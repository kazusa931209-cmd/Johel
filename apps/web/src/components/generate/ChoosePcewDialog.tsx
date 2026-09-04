"use client";

import { useEffect, useState } from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";
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
import { fullName } from "@/lib/profile";
import { useToast } from "@/components/app/ToastProvider";

export type PcewSelection = {
  profileId: string;
  companyId: string;
  experienceId: string;
  workflowId: string;
};

type ChoosePcewDialogProps = {
  initial: PcewSelection | null;
  onClose: () => void;
  onApply: (selection: PcewSelection) => void;
};

type FieldErrors = {
  profileId?: string;
  companyId?: string;
  experienceId?: string;
  workflowId?: string;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function ChoosePcewDialog({
  initial,
  onClose,
  onApply,
}: ChoosePcewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileDetail[]>([]);
  const [companies, setCompanies] = useState<CompanyDetail[]>([]);
  const [experiences, setExperiences] = useState<ExperienceDetail[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [profileId, setProfileId] = useState(initial?.profileId ?? "");
  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [experienceId, setExperienceId] = useState(
    initial?.experienceId ?? "",
  );
  const [workflowId, setWorkflowId] = useState(initial?.workflowId ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listProfiles("", 1),
      listCompanies("", 1),
      listExperiences("", 1),
      listWorkflows("", 1),
    ]).then(([p, c, e, w]) => {
      if (cancelled) return;
      if (p.error || c.error || e.error || w.error) {
        toast(
          p.error ?? c.error ?? e.error ?? w.error ?? "Failed to load options",
          "error",
        );
        onClose();
        return;
      }
      setProfiles(p.data?.items ?? []);
      setCompanies(c.data?.items ?? []);
      setExperiences(e.data?.items ?? []);
      setWorkflows(w.data?.items ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [onClose, toast]);

  function apply() {
    const nextErrors: FieldErrors = {};
    if (!profileId) nextErrors.profileId = "Profile is required.";
    if (!companyId) nextErrors.companyId = "Company is required.";
    if (!experienceId) nextErrors.experienceId = "Experience is required.";
    if (!workflowId) nextErrors.workflowId = "Workflow is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onApply({ profileId, companyId, experienceId, workflowId });
  }

  return (
    <DetailDialog title="Choose PCEW" onClose={onClose}>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <label className="block space-y-1 text-sm">
            <span>
              Profile
              <RequiredMark />
            </span>
            <select
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                if (fieldErrors.profileId) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    profileId: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.profileId)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            >
              <option value="">Select a profile</option>
              {profiles.map((row) => (
                <option key={row.id} value={row.id}>
                  {fullName(row.firstName, row.lastName)}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.profileId} />
          </label>

          <label className="block space-y-1 text-sm">
            <span>
              Company
              <RequiredMark />
            </span>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                if (fieldErrors.companyId) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    companyId: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.companyId)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            >
              <option value="">Select a company</option>
              {companies.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.companyId} />
          </label>

          <label className="block space-y-1 text-sm">
            <span>
              Experience
              <RequiredMark />
            </span>
            <select
              value={experienceId}
              onChange={(e) => {
                setExperienceId(e.target.value);
                if (fieldErrors.experienceId) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    experienceId: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.experienceId)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            >
              <option value="">Select an experience</option>
              {experiences.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.category}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.experienceId} />
          </label>

          <label className="block space-y-1 text-sm">
            <span>
              Workflow
              <RequiredMark />
            </span>
            <select
              value={workflowId}
              onChange={(e) => {
                setWorkflowId(e.target.value);
                if (fieldErrors.workflowId) {
                  setFieldErrors((errors) => ({
                    ...errors,
                    workflowId: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.workflowId)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            >
              <option value="">Select a workflow</option>
              {workflows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.workflowId} />
          </label>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={apply}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
            >
              Apply
            </button>
          </div>
        </>
      )}
    </DetailDialog>
  );
}
