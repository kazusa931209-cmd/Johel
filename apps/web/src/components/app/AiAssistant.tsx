"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { CloseButton } from "@/components/shared/action-icon-buttons";
import { AiAssistantIcon } from "@/components/shared/icons";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import {
  normalizeAiAssistantOpenOptions,
  type AiAssistantCategory,
  type AiAssistantOpenOptions,
} from "@/lib/ai-assistant";
import { runAiCheckOnExperiences } from "@/lib/api";
import {
  getSearchShortcutLabel,
  isGlobalSearchShortcut,
} from "@/lib/search-shortcut-label";

type AiAssistantContextValue = {
  openAiAssistant: (options?: AiAssistantOpenOptions) => void;
  closeAiAssistant: () => void;
};

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error("useAiAssistant must be used within AiAssistantProvider");
  }
  return ctx;
}

const CATEGORY_LABEL_KEYS: Record<AiAssistantCategory, string> = {
  "check-on-experiences": "aiAssistant.checkOnExperiences.category",
};

export function AiAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [openOptions, setOpenOptions] = useState<AiAssistantOpenOptions>({});

  const openAiAssistant = useCallback((options?: AiAssistantOpenOptions) => {
    setOpenOptions(options ?? {});
    setOpen(true);
  }, []);

  const closeAiAssistant = useCallback(() => {
    setOpen(false);
    setOpenOptions({});
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isGlobalSearchShortcut(event)) return;
      event.preventDefault();
      openAiAssistant();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openAiAssistant]);

  const value = useMemo(
    () => ({ openAiAssistant, closeAiAssistant }),
    [openAiAssistant, closeAiAssistant],
  );

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      {open ? (
        <AiAssistantDialog
          initialOptions={openOptions}
          onClose={closeAiAssistant}
        />
      ) : null}
    </AiAssistantContext.Provider>
  );
}

export function AiAssistantTrigger() {
  const t = useT();
  const { openAiAssistant } = useAiAssistant();
  const shortcutLabel = getSearchShortcutLabel();

  return (
    <button
      type="button"
      onClick={() => openAiAssistant()}
      aria-label={t("nav.header.aiAssistant.openAria")}
      className="flex h-9 w-full max-w-xs min-w-[12rem] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted hover:bg-surface-muted"
    >
      <AiAssistantIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">
        {t("nav.header.aiAssistant.placeholder")}
      </span>
      <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-muted sm:inline">
        {shortcutLabel}
      </kbd>
    </button>
  );
}

function AiAssistantDialog({
  initialOptions,
  onClose,
}: {
  initialOptions: AiAssistantOpenOptions;
  onClose: () => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const normalized = useMemo(
    () => normalizeAiAssistantOpenOptions(initialOptions),
    [initialOptions],
  );
  const [category] = useState<AiAssistantCategory>(normalized.category);
  const [query, setQuery] = useState(normalized.query);
  const [generationId] = useState(normalized.generationId);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState<string | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submitCheckOnExperiences = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setQueryError(t("aiAssistant.checkOnExperiences.queryRequired"));
      return;
    }

    setQueryError(null);
    setLoading(true);
    setResponseMarkdown(null);

    const res = await runAiCheckOnExperiences({
      searchText: trimmed,
      generationId,
    });

    setLoading(false);

    if (res.error || !res.data) {
      toast(res.error ?? t("aiAssistant.checkOnExperiences.failed"), "error");
      return;
    }

    setResponseMarkdown(res.data.markdown);
    await refreshTokenUsed();
    toast(t("aiAssistant.checkOnExperiences.success"), "success");
  }, [generationId, query, refreshTokenUsed, t, toast]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void submitCheckOnExperiences();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.header.aiAssistant.title")}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        style={{ maxHeight: "min(36rem, calc(100vh - 12vh))" }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("nav.header.aiAssistant.title")}
          </h2>
          <CloseButton
            onClick={onClose}
            label={t("nav.header.aiAssistant.close")}
          />
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium"
              >
                {t(CATEGORY_LABEL_KEYS[category])}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <label className="block space-y-1 text-sm">
              <span>{t("aiAssistant.checkOnExperiences.inputLabel")}</span>
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (queryError) setQueryError(null);
                }}
                rows={4}
                placeholder={t("aiAssistant.checkOnExperiences.inputPlaceholder")}
                aria-invalid={Boolean(queryError)}
                className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
              />
              {queryError ? (
                <p className="text-sm text-danger">{queryError}</p>
              ) : null}
            </label>

            {loading ? (
              <p className="mt-4 text-sm text-muted">
                {t("nav.header.aiAssistant.loading")}
              </p>
            ) : null}

            {responseMarkdown ? (
              <div className="mt-4 rounded-md border border-border bg-background px-4 py-3">
                <AiVerdictMarkdown markdown={responseMarkdown} />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-border px-4 py-3">
            <button
              type="submit"
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              {loading
                ? t("nav.header.aiAssistant.sending")
                : t("nav.header.aiAssistant.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
