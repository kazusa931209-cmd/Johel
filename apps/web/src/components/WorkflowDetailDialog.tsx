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
import { fullName } from "@/lib/profile";
import { formatWorkflowPeriod, WORKFLOW_LANGUAGES } from "@/lib/workflow";

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
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map(),
  );
  const [experienceLabelById, setExperienceLabelById] = useState<
    Map<string, string>
  >(new Map());
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
      const profile = profiles.find((item) => item.id === workflow.profileId);
      setProfileName(
        profile ? fullName(profile.firstName, profile.lastName) : null,
      );

      setCompanyNameById(
        new Map(
          (companiesRes.data?.items ?? []).map((item) => [item.id, item.name]),
        ),
      );
      setExperienceLabelById(
        new Map(
          (experiencesRes.data?.items ?? []).map((item) => [
            item.id,
            item.category,
          ]),
        ),
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
            {detail.companies.length === 0 ? (
              <p className="text-muted">None added.</p>
            ) : (
              <ul className="space-y-2">
                {detail.companies.map((entry) => {
                  const companyName =
                    companyNameById.get(entry.companyId) ?? entry.companyId;
                  const experienceLabels = entry.experienceIds
                    .map((id) => experienceLabelById.get(id))
                    .filter((label): label is string => Boolean(label));

                  return (
                    <li
                      key={`${entry.companyId}-${entry.startDate}-${entry.endDate}`}
                      className="space-y-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="font-medium">{companyName}</div>
                      <div className="text-muted">
                        {formatWorkflowPeriod(entry.startDate, entry.endDate)}
                      </div>
                      {entry.roleContext ? (
                        <div className="text-muted">
                          <span className="font-medium text-foreground">
                            Role context:
                          </span>{" "}
                          {entry.roleContext}
                        </div>
                      ) : null}
                      {experienceLabels.length === 0 ? (
                        <p className="text-muted">No experiences linked.</p>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-muted">
                          {experienceLabels.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </DetailDialog>
  );
}
