"use client";

import { DetailDialog, DetailField } from "@/components/shared/detail-dialog";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
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
      <DetailField label="Alias" value={company.alias} />
      <DetailField label="Company Name" value={company.name} />
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          What this company is
        </div>
        {company.whatCompanyIs ? (
          <AiVerdictMarkdown markdown={company.whatCompanyIs} />
        ) : (
          <div className="text-foreground">—</div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          Domain & Stack
        </div>
        {company.domainAndStack ? (
          <AiVerdictMarkdown markdown={company.domainAndStack} />
        ) : (
          <div className="text-foreground">—</div>
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
