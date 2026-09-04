"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";
import { ProfileLinksEditor } from "@/components/ProfileLinksEditor";
import { useToast } from "@/components/app/ToastProvider";
import {
  createProfile,
  updateProfile,
  type ProfileDetail,
  type ProfileWritePayload,
} from "@/lib/api";
import type { ProfileLinkItem } from "@/lib/profile";

type ProfileFormProps = {
  mode: "create" | "edit";
  profileId?: string;
  initial?: Partial<ProfileDetail>;
};

type FieldErrors = {
  firstName?: string;
  lastName?: string;
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
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [pn, setPn] = useState(initial?.pn ?? "");
  const [residence, setResidence] = useState(initial?.residence ?? "");
  const [education, setEducation] = useState(initial?.education ?? "");
  const [links, setLinks] = useState<ProfileLinkItem[]>(initial?.links ?? []);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = "First Name is required.";
    }
    if (!lastName.trim()) {
      nextErrors.lastName = "Last Name is required.";
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
      education: education.trim() || null,
      links,
    };
    setSaving(true);
    const res =
      mode === "edit" && profileId
        ? await updateProfile(profileId, payload)
        : await createProfile(payload);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed", "error");
      return;
    }
    toast(mode === "edit" ? "Profile updated." : "Profile created.", "success");
    router.push("/profiles");
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton href="/profiles" aria-label="Back to profiles" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit profile" : "Add profile"}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          Configure personal details and links for this profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>
            First Name
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.firstName} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            Last Name
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
          />
          <FieldError message={fieldErrors.lastName} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Birth date</span>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>PN</span>
        <input
          value={pn}
          onChange={(e) => setPn(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Residence</span>
        <input
          value={residence}
          onChange={(e) => setResidence(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Education</span>
        <textarea
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
      </label>

      <ProfileLinksEditor links={links} onChange={setLinks} />

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/profiles")}
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
