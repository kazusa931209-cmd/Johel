"use client";

import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import type { CompanyDetail } from "@/lib/api";

type CompanyDetailDialogProps = {
  company: CompanyDetail;
  onClose: () => void;
};

export function CompanyDetailDialog({
  company,
  onClose,
}: CompanyDetailDialogProps) {
  return (
    <DetailDialog title={company.name || "Company detail"} onClose={onClose}>
      <DetailField label="Company Name" value={company.name} />
      <DetailField label="Description" value={company.description} />
      <DetailField label="Priority" value={company.priority} />
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          Metadata
        </div>
        {company.metadata.length === 0 ? (
          <p className="text-muted">No metadata.</p>
        ) : (
          <ul className="space-y-2">
            {company.metadata.map((item) => (
              <li
                key={item.key}
                className="rounded-md border border-border px-3 py-2"
              >
                <div className="font-medium">{item.key}</div>
                <div className="break-all text-muted">{item.value || "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <DetailField
        label="Created"
        value={new Date(company.createdAt).toLocaleString()}
      />
      <DetailField
        label="Updated"
        value={new Date(company.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
