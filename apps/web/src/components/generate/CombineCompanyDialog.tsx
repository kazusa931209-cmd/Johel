"use client";

import { useCallback, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import { PcewSection } from "@/components/generate/PcewSection";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { DetailDialog } from "@/components/shared/detail-dialog";
import {
  listCompanies,
  listExperiences,
  type CompanyDetail,
  type ExperienceDetail,
} from "@/lib/api";

type CombineCompanyDialogProps = {
  mode: "add" | "edit";
  initial: CombineCompanyEntry;
  companyName?: string;
  excludedCompanyIds: string[];
  onSave: (entry: CombineCompanyEntry) => void;
  onClose: () => void;
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

export function CombineCompanyDialog({
  mode,
  initial,
  companyName,
  excludedCompanyIds,
  onSave,
  onClose,
}: CombineCompanyDialogProps) {
  const t = useT();
  const [companyId, setCompanyId] = useState(initial.companyId);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [roleContext, setRoleContext] = useState(initial.roleContext);
  const [experienceIds, setExperienceIds] = useState(initial.experienceIds);
  const [viewingCompany, setViewingCompany] = useState<CompanyDetail | null>(
    null,
  );
  const [viewingExperience, setViewingExperience] =
    useState<ExperienceDetail | null>(null);
  const [errors, setErrors] = useState<{
    companyId?: string;
    startDate?: string;
    endDate?: string;
    roleContext?: string;
    experienceIds?: string;
  }>({});

  const fetchCompanies = useCallback(async () => {
    const res = await listCompanies("", null);
    if (!res.data) return res;
    return {
      ...res,
      data: {
        ...res.data,
        items: res.data.items.filter(
          (item) => !excludedCompanyIds.includes(item.id),
        ),
      },
    };
  }, [excludedCompanyIds]);

  const fetchExperiences = useCallback(() => listExperiences("", null), []);

  function applySave() {
    const nextErrors: typeof errors = {};
    if (mode === "add" && !companyId) {
      nextErrors.companyId = t("validation.companyRequired");
    }
    if (!startDate.trim()) {
      nextErrors.startDate = t("validation.startDateRequired");
    }
    if (!endDate.trim()) {
      nextErrors.endDate = t("validation.endDateRequired");
    }
    if (!roleContext.trim()) {
      nextErrors.roleContext = t("validation.roleContextRequired");
    }
    if (experienceIds.length < 1) {
      nextErrors.experienceIds = t("validation.experiencesMinOne");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({
      companyId,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      roleContext: roleContext.trim(),
      experienceIds,
    });
  }

  return (
    <DetailDialog
      mode="form"
      title={
        mode === "add"
          ? t("crud.workflows.companiesEditor.addCompany")
          : t("crud.workflows.companiesEditor.editCompany")
      }
      onClose={onClose}
      panelClassName="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden text-sm"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {mode === "edit" && companyName ? (
          <div className="space-y-1">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("crud.workflows.companiesEditor.company")}
            </div>
            <div className="rounded-md border border-border px-3 py-2 font-medium">
              {companyName}
            </div>
          </div>
        ) : (
          <PcewSection<CompanyDetail>
            title={t("crud.workflows.companiesEditor.company")}
            emptyLabel={t("crud.workflows.companiesEditor.emptyCompanies")}
            error={errors.companyId}
            selectionMode="single"
            isSelected={(id) => companyId === id}
            onRowSelect={(id) => {
              setCompanyId(id);
              if (errors.companyId) {
                setErrors((prev) => ({ ...prev, companyId: undefined }));
              }
            }}
            fetchAll={fetchCompanies}
            loadErrorLabel={t("toast.companiesLoadFailed")}
            viewing={viewingCompany}
            onView={setViewingCompany}
            minWidthClass="min-w-[560px]"
            columns={[
              {
                header: t("crud.companies.columns.alias"),
                cell: (row) => <span className="font-medium">{row.alias}</span>,
              },
              {
                header: t("crud.companies.columns.companyName"),
                cell: (row) => row.name,
              },
              {
                header: t("crud.companies.columns.whatCompanyIs"),
                className: "max-w-[280px] truncate text-muted",
                cell: (row) => row.whatCompanyIs,
              },
            ]}
            renderDetailDialog={(row) => (
              <CompanyDetailDialog
                company={row}
                onClose={() => setViewingCompany(null)}
              />
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>
              {t("crud.workflows.companiesEditor.start")}
              <RequiredMark />
            </span>
            <input
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (errors.startDate) {
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.startDate)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
            <FieldError message={errors.startDate} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>
              {t("crud.workflows.companiesEditor.end")}
              <RequiredMark />
            </span>
            <input
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (errors.endDate) {
                  setErrors((prev) => ({ ...prev, endDate: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.endDate)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
            />
            <FieldError message={errors.endDate} />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span>
            {t("crud.workflows.companiesEditor.roleContext")}
            <RequiredMark />
          </span>
          <p className="text-xs text-muted">
            {t("guidance.workflow.roleContextGuideline")}
          </p>
          <input
            value={roleContext}
            onChange={(e) => {
              setRoleContext(e.target.value);
              if (errors.roleContext) {
                setErrors((prev) => ({ ...prev, roleContext: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.roleContext)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
          <FieldError message={errors.roleContext} />
        </label>

        <PcewSection<ExperienceDetail>
          title={t("crud.workflows.companiesEditor.experiences")}
          emptyLabel={t("crud.workflows.companiesEditor.emptyExperiences")}
          error={errors.experienceIds}
          selectionMode="multiple"
          isSelected={(id) => experienceIds.includes(id)}
          onRowSelect={(id) => {
            const next = experienceIds.includes(id)
              ? experienceIds.filter((item) => item !== id)
              : [...experienceIds, id];
            setExperienceIds(next);
            if (next.length > 0 && errors.experienceIds) {
              setErrors((prev) => ({ ...prev, experienceIds: undefined }));
            }
          }}
          fetchAll={fetchExperiences}
          loadErrorLabel={t("toast.experiencesLoadFailed")}
          viewing={viewingExperience}
          onView={setViewingExperience}
          columns={[
            {
              header: t("crud.experiences.columns.category"),
              cell: (row) => (
                <span className="font-medium">{row.category}</span>
              ),
            },
            {
              header: t("crud.experiences.columns.problem"),
              className: "max-w-[240px] truncate text-muted",
              cell: (row) => row.problem,
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

      <div className="flex shrink-0 justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={applySave}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {t("crud.common.save")}
        </button>
      </div>
    </DetailDialog>
  );
}
