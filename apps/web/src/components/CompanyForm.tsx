"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";
import { CompanyMetadataEditor } from "@/components/CompanyMetadataEditor";
import { useToast } from "@/components/app/ToastProvider";
import {
  createCompany,
  listCompanies,
  updateCompany,
  type CompanyDetail,
  type CompanyWritePayload,
} from "@/lib/api";
import type { CompanyMetadataItem } from "@/lib/company";

type CompanyFormProps = {
  mode: "create" | "edit";
  companyId?: string;
  initial?: Partial<CompanyDetail>;
};

type FieldErrors = {
  name?: string;
  description?: string;
  priority?: string;
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

export function CompanyForm({ mode, companyId, initial }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState(
    initial?.priority != null ? String(initial.priority) : "",
  );
  const [metadata, setMetadata] = useState<CompanyMetadataItem[]>(
    initial?.metadata ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (mode !== "create" || initial?.priority != null) return;
    let cancelled = false;
    listCompanies("", 1).then((res) => {
      if (cancelled || !res.data) return;
      const nextPriority = res.data.nextPriority;
      setPriority((current) =>
        current.trim() === "" ? String(nextPriority) : current,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [mode, initial?.priority]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Company Name is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    }
    const parsedPriority = Number.parseInt(priority.trim(), 10);
    if (
      !priority.trim() ||
      !Number.isInteger(parsedPriority) ||
      parsedPriority < 1
    ) {
      nextErrors.priority = "Priority must be a number of 1 or greater.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CompanyWritePayload = {
      name: name.trim(),
      description: description.trim(),
      priority: parsedPriority,
      metadata,
    };
    setSaving(true);
    const res =
      mode === "edit" && companyId
        ? await updateCompany(companyId, payload)
        : await createCompany(payload);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed", "error");
      return;
    }
    toast(mode === "edit" ? "Company updated." : "Company created.", "success");
    router.push("/companies");
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton href="/companies" aria-label="Back to companies" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit company" : "Add company"}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          Configure company details, priority, and metadata.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          Company Name
          <RequiredMark />
        </span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              setFieldErrors((errors) => ({ ...errors, name: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.name)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.name} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Description
          <RequiredMark />
        </span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (fieldErrors.description) {
              setFieldErrors((errors) => ({
                ...errors,
                description: undefined,
              }));
            }
          }}
          rows={24}
          aria-invalid={Boolean(fieldErrors.description)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.description} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Priority
          <RequiredMark />
        </span>
        <input
          type="number"
          min={1}
          step={1}
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            if (fieldErrors.priority) {
              setFieldErrors((errors) => ({ ...errors, priority: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.priority)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.priority} />
      </label>

      <CompanyMetadataEditor metadata={metadata} onChange={setMetadata} />

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => router.push("/companies")}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
