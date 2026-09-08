"use client";

import { useT } from "@/components/app/LocaleProvider";
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
  const t = useT();

  return (
    <DetailDialog
      title={company.name || t("crud.companies.detailTitle")}
      onClose={onClose}
    >
      <DetailField label={t("crud.companies.columns.alias")} value={company.alias} />
      <DetailField
        label={t("crud.companies.columns.companyName")}
        value={company.name}
      />
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("crud.companies.columns.whatCompanyIs")}
        </div>
        {company.whatCompanyIs ? (
          <AiVerdictMarkdown markdown={company.whatCompanyIs} />
        ) : (
          <div className="text-foreground">{t("crud.common.emDash")}</div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("crud.companies.columns.domainAndStack")}
        </div>
        {company.domainAndStack ? (
          <AiVerdictMarkdown markdown={company.domainAndStack} />
        ) : (
          <div className="text-foreground">{t("crud.common.emDash")}</div>
        )}
      </div>
      <DetailField
        label={t("crud.common.created")}
        value={new Date(company.createdAt).toLocaleString()}
      />
      <DetailField
        label={t("crud.common.updated")}
        value={new Date(company.updatedAt).toLocaleString()}
      />
    </DetailDialog>
  );
}
