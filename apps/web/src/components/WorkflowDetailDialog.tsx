"use client";

import { useEffect, useState } from "react";
import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { useToast } from "@/components/app/ToastProvider";
import {
  getWorkflow,
  listCompanies,
  listExperiences,
  listProfiles,
  type WorkflowDetail,
} from "@/lib/api";
import { WORKFLOW_LANGUAGES } from "@/lib/workflow";
import { fullName } from "@/lib/profile";

type WorkflowDetailDialogProps = {
  workflowId: string;
  onClose: () => void;
};

function languageLabel(code: string) {
  return (
    WORKFLOW_LANGUAGES.find((item) => item.value === code)?.label ?? code
  );
}

export function WorkflowDetailDialog({
  workflowId,
  onClose,
}: WorkflowDetailDialogProps) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [experienceLabels, setExperienceLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getWorkflow(workflowId),
      listProfiles("", null),
      listCompanies("", null),
      listExperiences("", null),
    ]).then(([workflowRes, profilesRes, companiesRes, experiencesRes]) => {
      if (cancelled) return;
      if (workflowRes.error || !workflowRes.data) {
        toast(workflowRes.error ?? "Failed to load workflow", "error");
        onClose();
        return;
      }

      const workflow = workflowRes.data;
      setDetail(workflow);

      const profiles = profilesRes.data?.items ?? [];
      const companies = companiesRes.data?.items ?? [];
      const experiences = experiencesRes.data?.items ?? [];

      const profile = profiles.find((item) => item.id === workflow.profileId);
      setProfileName(
        profile ? fullName(profile.firstName, profile.lastName) : null,
      );

      const companyNameById = new Map(
        companies.map((item) => [item.id, item.name]),
      );
      setCompanyNames(
        workflow.companyIds
          .map((id) => companyNameById.get(id))
          .filter((name): name is string => Boolean(name)),
      );

      const experienceLabelById = new Map(
        experiences.map((item) => [item.id, item.category]),
      );
      setExperienceLabels(
        workflow.experienceIds
          .map((id) => experienceLabelById.get(id))
          .filter((label): label is string => Boolean(label)),
      );

      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per workflowId
  }, [workflowId, toast]);

  return (
    <DetailDialog title="Workflow detail" onClose={onClose}>
      {loading || !detail ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <DetailField label="Name" value={detail.name} />
          <DetailField label="Description" value={detail.description} />
          <DetailField
            label="Language"
            value={languageLabel(detail.language)}
          />
          <DetailField
            label="Created"
            value={new Date(detail.createdAt).toLocaleString()}
          />
          <DetailField
            label="Updated"
            value={new Date(detail.updatedAt).toLocaleString()}
          />
          <DetailField
            label="Profile"
            value={profileName ?? "Not selected"}
          />
          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              Companies
            </div>
            {companyNames.length === 0 ? (
              <p className="text-muted">None selected.</p>
            ) : (
              <ul className="space-y-1">
                {companyNames.map((name) => (
                  <li key={name} className="rounded-md border border-border px-3 py-2">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              Experiences
            </div>
            {experienceLabels.length === 0 ? (
              <p className="text-muted">None selected.</p>
            ) : (
              <ul className="space-y-1">
                {experienceLabels.map((label) => (
                  <li
                    key={label}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DetailDialog>
  );
}
