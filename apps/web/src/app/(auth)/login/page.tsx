"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { useT } from "@/components/app/LocaleProvider";
import { getMe, login } from "@/lib/api";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);
    const res = await login(loginId, password);
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error ?? t("validation.loginFailed"));
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
          <h1 className="text-xl font-semibold">{t("auth.login.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("auth.login.subtitle")}</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span>{t("auth.loginId")}</span>
          <input
            type="text"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("auth.password")}</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
        <p className="text-center text-sm text-muted">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-foreground underline">
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </form>
    </main>
  );
}
