"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { BackButton } from "@/components/shared/back-button";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { useToast } from "@/components/app/ToastProvider";
import {
  createCompany,
  updateCompany,
  type CompanyDetail,
  type CompanyWritePayload,
} from "@/lib/api";
import {
  AUTO_MARKDOWN_FORMAT_HINT,
  needsMarkdownFormatOnSave,
} from "@/lib/markdown-format";
import { DESCRIPTION_AS_RESUME_PROMPT_HINT } from "@/lib/entity-description";
import {
  COMPANY_DOMAIN_STACK_BAD,
  COMPANY_DOMAIN_STACK_GOOD,
  COMPANY_DOMAIN_STACK_GUIDELINE,
  COMPANY_SHARED_GUIDANCE,
  COMPANY_WHAT_IT_IS_BAD,
  COMPANY_WHAT_IT_IS_GOOD,
  COMPANY_WHAT_IT_IS_GUIDELINE,
} from "@/lib/company-field-guidance";

type CompanyFormProps = {
  mode: "create" | "edit";
  companyId?: string;
  initial?: Partial<CompanyDetail>;
};

type FieldErrors = {
  alias?: string;
  name?: string;
  whatCompanyIs?: string;
  domainAndStack?: string;
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

function FieldExamples({
  good,
  bad,
}: {
  good: string | string[];
  bad: string;
}) {
  const goodItems = Array.isArray(good) ? good : [good];
  return (
    <div className="space-y-1 text-xs text-muted">
      <p>
        <span className="font-medium text-foreground">Good:</span>{" "}
        {goodItems.map((item, index) => (
          <span key={item}>
            {index > 0 ? " / " : ""}
            &ldquo;{item}&rdquo;
          </span>
        ))}
      </p>
      <p>
        <span className="font-medium text-foreground">Bad:</span>{" "}
        &ldquo;{bad}&rdquo;
      </p>
    </div>
  );
}

export function CompanyForm({ mode, companyId, initial }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [whatCompanyIs, setWhatCompanyIs] = useState(
    initial?.whatCompanyIs ?? "",
  );
  const [domainAndStack, setDomainAndStack] = useState(
    initial?.domainAndStack ?? "",
  );
  const [storedWhatCompanyIs] = useState(initial?.whatCompanyIs ?? "");
  const [storedDomainAndStack] = useState(initial?.domainAndStack ?? "");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!alias.trim()) {
      nextErrors.alias = "Alias is required.";
    }
    if (!name.trim()) {
      nextErrors.name = "Company Name is required.";
    }
    if (!whatCompanyIs.trim()) {
      nextErrors.whatCompanyIs = "What this company is is required.";
    }
    if (!domainAndStack.trim()) {
      nextErrors.domainAndStack = "Domain & Stack is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CompanyWritePayload = {
      alias: alias.trim(),
      name: name.trim(),
      whatCompanyIs: whatCompanyIs.trim(),
      domainAndStack: domainAndStack.trim(),
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
    await refreshTokenUsed();
    toast(mode === "edit" ? "Company updated." : "Company created.", "success");
    router.push("/companies");
  }

  const convertingWhat = needsMarkdownFormatOnSave(
    whatCompanyIs,
    storedWhatCompanyIs,
  );
  const convertingDomain = needsMarkdownFormatOnSave(
    domainAndStack,
    storedDomainAndStack,
  );
  const converting = saving && (convertingWhat || convertingDomain);

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
          Configure alias, company name, and structured context fields used as
          resume-generation prompts.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          Alias
          <RequiredMark />
        </span>
        <input
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value);
            if (fieldErrors.alias) {
              setFieldErrors((errors) => ({ ...errors, alias: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.alias)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.alias} />
      </label>

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
          What this company is
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">{COMPANY_WHAT_IT_IS_GUIDELINE}</p>
        <textarea
          value={whatCompanyIs}
          onChange={(e) => {
            setWhatCompanyIs(e.target.value);
            if (fieldErrors.whatCompanyIs) {
              setFieldErrors((errors) => ({
                ...errors,
                whatCompanyIs: undefined,
              }));
            }
          }}
          rows={6}
          aria-invalid={Boolean(fieldErrors.whatCompanyIs)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldExamples good={COMPANY_WHAT_IT_IS_GOOD} bad={COMPANY_WHAT_IT_IS_BAD} />
        <p className="text-xs text-muted">{DESCRIPTION_AS_RESUME_PROMPT_HINT}</p>
        <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
        <FieldError message={fieldErrors.whatCompanyIs} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Domain & Stack
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">{COMPANY_DOMAIN_STACK_GUIDELINE}</p>
        <textarea
          value={domainAndStack}
          onChange={(e) => {
            setDomainAndStack(e.target.value);
            if (fieldErrors.domainAndStack) {
              setFieldErrors((errors) => ({
                ...errors,
                domainAndStack: undefined,
              }));
            }
          }}
          rows={10}
          aria-invalid={Boolean(fieldErrors.domainAndStack)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldExamples
          good={COMPANY_DOMAIN_STACK_GOOD}
          bad={COMPANY_DOMAIN_STACK_BAD}
        />
        <p className="text-xs text-muted">{DESCRIPTION_AS_RESUME_PROMPT_HINT}</p>
        <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
        <FieldError message={fieldErrors.domainAndStack} />
      </label>

      <p className="text-xs text-muted">{COMPANY_SHARED_GUIDANCE}</p>

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

      {converting ? (
        <BusyOverlay
          title="Converting to markdown…"
          description="Please wait while the fields are formatted."
        />
      ) : null}
    </form>
  );
}
