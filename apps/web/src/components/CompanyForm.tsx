"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "@/components/app/LocaleProvider";
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
import { useCrudFormNavigation } from "@/lib/crud-form-navigation";
import { needsMarkdownFormatOnSave } from "@/lib/markdown-format";

type CompanyFormProps = {
  mode: "create" | "edit";
  companyId?: string;
  initial?: Partial<CompanyDetail>;
};

type FieldErrors = {
  displayPriority?: string;
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
  multiline = false,
  t,
}: {
  good: string | string[];
  bad: string;
  multiline?: boolean;
  t: (key: string) => string;
}) {
  const goodItems = Array.isArray(good) ? good : [good];
  if (multiline) {
    return (
      <div className="space-y-1 text-xs text-muted">
        <p>
          <span className="font-medium text-foreground">
            {t("crud.companies.form.exampleLabel")}
          </span>
        </p>
        <pre className="whitespace-pre-wrap font-sans">{goodItems.join("\n")}</pre>
        <p>
          <span className="font-medium text-foreground">
            {t("crud.companies.form.badLabel")}
          </span>{" "}
          &ldquo;{bad}&rdquo;
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1 text-xs text-muted">
      <p>
        <span className="font-medium text-foreground">
          {t("crud.companies.form.goodLabel")}
        </span>{" "}
        {goodItems.map((item, index) => (
          <span key={item}>
            {index > 0 ? " / " : ""}
            &ldquo;{item}&rdquo;
          </span>
        ))}
      </p>
      <p>
        <span className="font-medium text-foreground">
          {t("crud.companies.form.badLabel")}
        </span>{" "}
        &ldquo;{bad}&rdquo;
      </p>
    </div>
  );
}

export function CompanyForm({ mode, companyId, initial }: CompanyFormProps) {
  const { t, tLines } = useLocale();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const { goBack } = useCrudFormNavigation("/companies");
  const [displayPriority, setDisplayPriority] = useState(
    initial?.displayPriority != null ? String(initial.displayPriority) : "1",
  );
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
    const parsedDisplayPriority = Number.parseInt(displayPriority.trim(), 10);
    if (!displayPriority.trim() || Number.isNaN(parsedDisplayPriority)) {
      nextErrors.displayPriority = t("validation.displayPriorityRequired");
    } else if (parsedDisplayPriority < 1) {
      nextErrors.displayPriority = t("validation.displayPriorityMin");
    }
    if (!alias.trim()) {
      nextErrors.alias = t("validation.aliasRequired");
    }
    if (!name.trim()) {
      nextErrors.name = t("validation.companyNameRequired");
    }
    if (!whatCompanyIs.trim()) {
      nextErrors.whatCompanyIs = t("validation.whatCompanyIsRequired");
    }
    if (!domainAndStack.trim()) {
      nextErrors.domainAndStack = t("validation.domainAndStackRequired");
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CompanyWritePayload = {
      displayPriority: parsedDisplayPriority,
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
      toast(res.error ?? t("toast.companySaveFailed"), "error");
      return;
    }
    await refreshTokenUsed();
    toast(
      mode === "edit" ? t("toast.companyUpdated") : t("toast.companyCreated"),
      "success",
    );
    goBack();
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
          <BackButton
            href="/companies"
            preferHistoryBack
            aria-label={t("crud.companies.form.backAria")}
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit"
              ? t("crud.companies.form.editTitle")
              : t("crud.companies.form.addTitle")}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          {t("crud.companies.form.description")}
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.companies.form.displayPriority")}
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">
          {t("crud.companies.form.displayPriorityHint")}
        </p>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={displayPriority}
          onChange={(e) => {
            setDisplayPriority(e.target.value);
            if (fieldErrors.displayPriority) {
              setFieldErrors((errors) => ({
                ...errors,
                displayPriority: undefined,
              }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.displayPriority)}
          className="w-full max-w-40 rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.displayPriority} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.companies.form.alias")}
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
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.alias} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.companies.form.companyName")}
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
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.name} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.companies.form.whatCompanyIs")}
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">
          {t("guidance.company.whatItIsGuideline")}
        </p>
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
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <FieldExamples
          t={t}
          good={t("guidance.company.whatItIsGood")}
          bad={t("guidance.company.whatItIsBad")}
        />
        <p className="text-xs text-muted">
          {t("guidance.descriptionAsResumePrompt")}
        </p>
        <p className="text-xs text-muted">{t("guidance.autoMarkdownFormat")}</p>
        <FieldError message={fieldErrors.whatCompanyIs} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          {t("crud.companies.form.domainAndStack")}
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">
          {t("guidance.company.domainStackGuideline")}
        </p>
        <p className="text-xs text-muted">
          {t("guidance.company.structuredFieldFormat")}
        </p>
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
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <FieldExamples
          t={t}
          good={tLines("guidance.company.domainStackGood")}
          bad={t("guidance.company.domainStackBad")}
          multiline
        />
        <p className="text-xs text-muted">
          {t("guidance.descriptionAsResumePrompt")}
        </p>
        <p className="text-xs text-muted">{t("guidance.autoMarkdownFormat")}</p>
        <FieldError message={fieldErrors.domainAndStack} />
      </label>

      <p className="text-xs text-muted">{t("guidance.company.shared")}</p>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={goBack}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.cancel")}
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {saving ? t("crud.common.saving") : t("crud.common.save")}
        </button>
      </div>

      {converting ? (
        <BusyOverlay
          title={t("crud.companies.form.convertingTitle")}
          description={t("crud.companies.form.convertingDescription")}
        />
      ) : null}
    </form>
  );
}
