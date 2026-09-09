"use client";

import { FormEvent, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { BackButton } from "@/components/shared/back-button";
import { ProfileLinksEditor } from "@/components/ProfileLinksEditor";
import { useToast } from "@/components/app/ToastProvider";
import { invalidateWorkspaceCrudCaches } from "@/lib/cached-crud-list";
import {
  createProfile,
  updateProfile,
  type ProfileDetail,
  type ProfileWritePayload,
} from "@/lib/api";
import { useCrudFormNavigation } from "@/lib/crud-form-navigation";
import type { ProfileLinkItem } from "@/lib/profile";

type ProfileFormProps = {
  mode: "create" | "edit";
  profileId?: string;
  initial?: Partial<ProfileDetail>;
};

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  graduationYear?: string;
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

export function ProfileForm({ mode, profileId, initial }: ProfileFormProps) {
  const t = useT();
  const { toast } = useToast();
  const { goBack } = useCrudFormNavigation("/profiles");
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [pn, setPn] = useState(initial?.pn ?? "");
  const [residence, setResidence] = useState(initial?.residence ?? "");
  const [university, setUniversity] = useState(initial?.university ?? "");
  const [graduationYear, setGraduationYear] = useState(
    initial?.graduationYear != null ? String(initial.graduationYear) : "",
  );
  const [degree, setDegree] = useState(initial?.degree ?? "");
  const [links, setLinks] = useState<ProfileLinkItem[]>(initial?.links ?? []);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = t("validation.firstNameRequired");
    }
    if (!lastName.trim()) {
      nextErrors.lastName = t("validation.lastNameRequired");
    }
    const parsedGraduationYear = Number.parseInt(graduationYear.trim(), 10);
    if (!graduationYear.trim() || Number.isNaN(parsedGraduationYear)) {
      nextErrors.graduationYear = t("validation.graduationYearRequired");
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ProfileWritePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.trim() || null,
      email: email.trim() || null,
      pn: pn.trim() || null,
      residence: residence.trim() || null,
      university: university.trim() || null,
      graduationYear: parsedGraduationYear,
      degree: degree.trim() || null,
      links,
    };
    setSaving(true);
    const res =
      mode === "edit" && profileId
        ? await updateProfile(profileId, payload)
        : await createProfile(payload);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? t("toast.profileSaveFailed"), "error");
      return;
    }
    invalidateWorkspaceCrudCaches("profiles");
    toast(
      mode === "edit" ? t("toast.profileUpdated") : t("toast.profileCreated"),
      "success",
    );
    goBack();
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton
            href="/profiles"
            preferHistoryBack
            aria-label={t("crud.profiles.form.backAria")}
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit"
              ? t("crud.profiles.form.editTitle")
              : t("crud.profiles.form.addTitle")}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          {t("crud.profiles.form.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>
            {t("crud.profiles.form.firstName")}
            <RequiredMark />
          </span>
          <input
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (fieldErrors.firstName) {
                setFieldErrors((errors) => ({
                  ...errors,
                  firstName: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.firstName)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.firstName} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("crud.profiles.form.lastName")}
            <RequiredMark />
          </span>
          <input
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (fieldErrors.lastName) {
                setFieldErrors((errors) => ({
                  ...errors,
                  lastName: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.lastName)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.lastName} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.profiles.form.birthDate")}</span>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.profiles.form.email")}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.profiles.form.pn")}</span>
        <input
          value={pn}
          onChange={(e) => setPn(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.profiles.form.residence")}</span>
        <input
          value={residence}
          onChange={(e) => setResidence(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t("crud.profiles.form.university")}</span>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("crud.profiles.form.graduationYear")}
            <RequiredMark />
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1950}
            max={new Date().getFullYear()}
            value={graduationYear}
            onChange={(e) => {
              setGraduationYear(e.target.value);
              if (fieldErrors.graduationYear) {
                setFieldErrors((errors) => ({
                  ...errors,
                  graduationYear: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.graduationYear)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.graduationYear} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{t("crud.profiles.form.degree")}</span>
        <input
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
      </label>

      <ProfileLinksEditor links={links} onChange={setLinks} />

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
    </form>
  );
}
