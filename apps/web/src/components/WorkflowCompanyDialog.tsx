"use client";

import { useCallback, useState } from "react";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import { PcewSection } from "@/components/generate/PcewSection";
import { DetailDialog } from "@/components/shared/detail-dialog";
import {
  listCompanies,
  listExperiences,
  type CompanyDetail,
  type ExperienceDetail,
} from "@/lib/api";

type WorkflowCompanyDialogProps = {
  mode: "add" | "edit";
  initial: {
    companyId: string;
    startDate: string;
    endDate: string;
    experienceIds: string[];
  };
  companyName?: string;
  excludedCompanyIds: string[];
  onSave: (entry: {
    companyId: string;
    startDate: string;
    endDate: string;
    experienceIds: string[];
  }) => void;
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

export function WorkflowCompanyDialog({
  mode,
  initial,
  companyName,
  excludedCompanyIds,
  onSave,
  onClose,
}: WorkflowCompanyDialogProps) {
  const [companyId, setCompanyId] = useState(initial.companyId);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
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
      nextErrors.companyId = "Select one company.";
    }
    if (!startDate.trim()) {
      nextErrors.startDate = "Start is required.";
    }
    if (!endDate.trim()) {
      nextErrors.endDate = "End is required.";
    }
    if (experienceIds.length < 1) {
      nextErrors.experienceIds = "Select at least one experience.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({
      companyId,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      experienceIds,
    });
  }

  return (
    <DetailDialog
      mode="form"
      title={mode === "add" ? "Add company" : "Edit company"}
      onClose={onClose}
      panelClassName="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden text-sm"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
        {mode === "edit" && companyName ? (
          <div className="space-y-1">
            <div className="text-xs font-medium tracking-wide text-muted uppercase">
              Company
            </div>
            <div className="rounded-md border border-border px-3 py-2 font-medium">
              {companyName}
            </div>
          </div>
        ) : (
          <PcewSection<CompanyDetail>
            title="Company"
            emptyLabel="No companies found."
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
            loadErrorLabel="Failed to load companies"
            viewing={viewingCompany}
            onView={setViewingCompany}
            minWidthClass="min-w-[560px]"
            columns={[
              {
                header: "Company Name",
                cell: (row) => (
                  <span className="font-medium">{row.name}</span>
                ),
              },
              {
                header: "Description",
                className: "max-w-[280px] truncate text-muted",
                cell: (row) => row.description,
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
              Start
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
              End
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

        <PcewSection<ExperienceDetail>
          title="Experiences"
          emptyLabel="No experiences found."
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
          loadErrorLabel="Failed to load experiences"
          viewing={viewingExperience}
          onView={setViewingExperience}
          columns={[
            {
              header: "Category",
              cell: (row) => (
                <span className="font-medium">{row.category}</span>
              ),
            },
            {
              header: "Description",
              className: "max-w-[320px] truncate text-muted",
              cell: (row) => row.description,
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
          Save
        </button>
      </div>
    </DetailDialog>
  );
}
