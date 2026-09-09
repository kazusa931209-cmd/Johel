"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { useT } from "@/components/app/LocaleProvider";
import { getMe, register } from "@/lib/api";

type RegisterFieldErrors = {
  loginId?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe().then((res) => {
      if (cancelled) return;
      if (res.data) {
        router.replace("/");
        return;
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const nextErrors: RegisterFieldErrors = {};
    const trimmedLoginId = loginId.trim();
    if (!trimmedLoginId) {
      nextErrors.loginId = t("validation.loginIdRequired");
    }
    if (!password) {
      nextErrors.password = t("validation.passwordRequired");
    } else if (password.length < 8) {
      nextErrors.password = t("validation.passwordMinLength");
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = t("validation.confirmPasswordRequired");
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t("validation.passwordMismatch");
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    const res = await register(trimmedLoginId, password);
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error ?? t("validation.registrationFailed"));
      return;
    }
    router.replace("/");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted">
        {t("auth.checkingSession")}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <AuthBrand />
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">{t("auth.register.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("auth.register.subtitle")}</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span>
            {t("auth.loginId")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="text"
            value={loginId}
            onChange={(e) => {
              setLoginId(e.target.value);
              if (fieldErrors.loginId) {
                setFieldErrors((current) => ({ ...current, loginId: undefined }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.loginId)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          {fieldErrors.loginId ? (
            <p className="text-sm text-danger">{fieldErrors.loginId}</p>
          ) : null}
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("auth.password")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
          {fieldErrors.password ? (
            <p className="text-sm text-danger">{fieldErrors.password}</p>
          ) : null}
        </label>
        <label className="block space-y-1 text-sm">
          <span>
            {t("auth.confirmPassword")}
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          </span>
          <input
            type="password"
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
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
        <p className="text-center text-sm text-muted">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="text-foreground underline">
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </form>
    </main>
  );
}
