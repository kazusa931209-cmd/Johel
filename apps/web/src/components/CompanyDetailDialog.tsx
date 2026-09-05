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
