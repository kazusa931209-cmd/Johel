"use client";

import { FormEvent, useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { changePassword, type User } from "@/lib/api";
import { loadMe } from "@/lib/cached-settings";

type ResetFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function AccountPage() {
  const t = useT();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMe().then((res) => {
      if (cancelled) return;
      if (res.data) setUser(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onResetPassword(event: FormEvent) {
    event.preventDefault();

    const nextErrors: ResetFieldErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = t("validation.currentPasswordRequired");
    }
    if (!newPassword) {
      nextErrors.newPassword = t("validation.passwordRequired");
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = t("validation.passwordMinLength");
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = t("validation.confirmPasswordRequired");
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = t("validation.passwordMismatch");
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    const res = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (res.error || !res.data) {
      if (res.error === "Current password is incorrect") {
        toast(t("toast.passwordResetCurrentIncorrect"), "error");
        setFieldErrors({
          currentPassword: t("toast.passwordResetCurrentIncorrect"),
        });
      } else {
        toast(res.error ?? t("toast.passwordResetFailed"), "error");
      }
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast(t("toast.passwordResetSuccess"), "success");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("account.title")}
        </h1>
        <p className="text-muted">{t("account.description")}</p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="space-y-1 text-sm">
          <div className="text-muted">{t("account.loginId")}</div>
          <div className="font-medium font-mono">
            {user?.loginId ?? t("account.loadingPlaceholder")}
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(event) => void onResetPassword(event)}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="space-y-1">
          <h2 className="text-sm font-medium">
            {t("account.resetPassword.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("account.resetPassword.description")}
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span>
            {t("account.resetPassword.currentPassword")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (fieldErrors.currentPassword) {
                setFieldErrors((current) => ({
                  ...current,
                  currentPassword: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.currentPassword)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          {fieldErrors.currentPassword ? (
            <p className="text-sm text-danger">{fieldErrors.currentPassword}</p>
          ) : null}
        </label>

        <label className="block space-y-1 text-sm">
          <span>
            {t("account.resetPassword.newPassword")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (fieldErrors.newPassword) {
                setFieldErrors((current) => ({
                  ...current,
                  newPassword: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.newPassword)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          {fieldErrors.newPassword ? (
            <p className="text-sm text-danger">{fieldErrors.newPassword}</p>
          ) : null}
        </label>

        <label className="block space-y-1 text-sm">
          <span>
            {t("account.resetPassword.confirmPassword")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((current) => ({
                  ...current,
                  confirmPassword: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-sm text-danger">{fieldErrors.confirmPassword}</p>
          ) : null}
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? t("account.resetPassword.submitting")
              : t("account.resetPassword.submit")}
          </button>
        </div>
      </form>
    </section>
  );
}
