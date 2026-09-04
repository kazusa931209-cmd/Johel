"use client";

import { useEffect, useState } from "react";
import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { useToast } from "@/components/app/ToastProvider";
import { getWorkflow, type WorkflowDetail } from "@/lib/api";
import { WORKFLOW_LANGUAGES } from "@/lib/workflow";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWorkflow(workflowId).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? "Failed to load workflow", "error");
        onClose();
        return;
      }
      setDetail(res.data);
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
            label="Filtering Prompt"
            value={detail.filteringPrompt}
          />
          <DetailField label="Used" value={detail.used} />
          <DetailField
            label="Created"
            value={new Date(detail.createdAt).toLocaleString()}
          />
          <DetailField
            label="Updated"
            value={new Date(detail.updatedAt).toLocaleString()}
          />
          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              Metadata
            </div>
            {detail.metadata.length === 0 ? (
              <p className="text-muted">No metadata.</p>
            ) : (
              <ul className="space-y-2">
                {detail.metadata.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <div className="font-medium">{item.key}</div>
                    <div className="text-muted">
                      {item.rulePrompt || "—"}
                    </div>
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
