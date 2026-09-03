"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTheme } from "@/components/app/ThemeProvider";
import { useToast } from "@/components/app/ToastProvider";
import { getSettings, saveSettings } from "@/lib/api";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.7 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.1" />
      <path d="M6.6 6.6C4 8.4 2.5 11 2.5 12S6 19 12 19a10.5 10.5 0 0 0 5.4-1.5" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [masked, setMasked] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((res) => {
      if (cancelled) return;
      if (res.data) {
        setMasked(res.data.apiKeyMasked);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSettings("cursor", apiKey);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed", "error");
      return;
    }
    setMasked(res.data.apiKeyMasked);
    setApiKey("");
    setShowApiKey(false);
    toast("AI Agent settings saved.", "success");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted">Appearance and account preferences.</p>
      </div>
      <div className="max-w-md space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Theme</h2>
        <div className="flex gap-2">
          {OPTIONS.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "border border-border bg-surface-muted text-foreground hover:opacity-90"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <form
        onSubmit={onSave}
        className="max-w-md space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-medium">AI Agent</h2>
        <label className="block space-y-1 text-sm">
          <span>Provider</span>
          <div className="relative">
            <select
              value="cursor"
              disabled
              className="w-full appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-10 outline-none"
            >
              <option value="cursor">Cursor AI Agent</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        </label>
        <label className="block space-y-1 text-sm">
          <span>API Key</span>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : masked ? (
            <p className="font-mono text-sm text-muted">{masked}</p>
          ) : (
            <p className="text-sm text-muted">No key saved yet.</p>
          )}
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              autoComplete="off"
              minLength={8}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={masked ? "Enter a new key to replace" : "Enter API key"}
              className="w-full rounded-md border border-border bg-background py-2 pr-10 pl-3 outline-none focus:border-muted"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((value) => !value)}
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={saving || apiKey.trim().length < 8}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
