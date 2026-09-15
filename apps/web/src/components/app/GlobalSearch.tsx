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
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { CloseButton } from "@/components/shared/action-icon-buttons";
import { SearchIcon } from "@/components/shared/icons";
import {
  buildGlobalSearchLabelMap,
  runGlobalSearch,
  type GlobalSearchResult,
  type GlobalSearchResultKind,
} from "@/lib/global-search";
import {
  getSearchShortcutLabel,
  isGlobalSearchShortcut,
} from "@/lib/search-shortcut-label";

type GlobalSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

function useGlobalSearchContext() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error("GlobalSearch components must be used within GlobalSearchProvider");
  }
  return ctx;
}

const RESULT_KIND_LABEL_KEYS: Record<GlobalSearchResultKind, string> = {
  navigation: "nav.header.search.kind.navigation",
  profile: "nav.header.search.kind.profile",
  company: "nav.header.search.kind.company",
  experience: "nav.header.search.kind.experience",
  generation: "nav.header.search.kind.generation",
};

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isGlobalSearchShortcut(event)) return;
      event.preventDefault();
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ open, openSearch, closeSearch }),
    [open, openSearch, closeSearch],
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      {open ? <GlobalSearchDialog onClose={closeSearch} /> : null}
    </GlobalSearchContext.Provider>
  );
}

export function GlobalSearchTrigger() {
  const t = useT();
  const { openSearch } = useGlobalSearchContext();
  const shortcutLabel = getSearchShortcutLabel();

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label={t("nav.header.search.openAria")}
      className="flex h-9 w-full max-w-xs min-w-[12rem] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted hover:bg-surface-muted"
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">
        {t("nav.header.search.placeholder")}
      </span>
      <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-muted sm:inline">
        {shortcutLabel}
      </kbd>
    </button>
  );
}

function GlobalSearchDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelsByKey = useMemo(() => buildGlobalSearchLabelMap(t), [t]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();
    setLoading(Boolean(trimmed));

    const timer = window.setTimeout(
      () => {
        void runGlobalSearch(query, labelsByKey).then((items) => {
          if (cancelled) return;
          setResults(items);
          setLoading(false);
          setActiveIndex(0);
        });
      },
      trimmed ? 200 : 0,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, labelsByKey]);

  const selectResult = useCallback(
    (result: GlobalSearchResult) => {
      onClose();
      router.push(result.href);
    },
    [onClose, router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) selectResult(result);
    }
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
        aria-label={t("nav.header.search.title")}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("nav.header.search.placeholder")}
            aria-controls="global-search-results"
            className="min-w-0 flex-1 bg-transparent py-1.5 font-mono text-sm outline-none"
          />
          <CloseButton onClick={onClose} label={t("nav.header.search.close")} />
        </div>

        <div
          id="global-search-results"
          className="max-h-[min(24rem,calc(100vh-12rem))] overflow-y-auto p-2"
        >
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted">
              {t("nav.header.search.loading")}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              {t("nav.header.search.noResults")}
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={
                      index === activeIndex
                        ? "flex w-full flex-col gap-0.5 rounded-md bg-surface-muted px-3 py-2 text-left"
                        : "flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left hover:bg-surface-muted"
                    }
                  >
                    <span className="flex min-w-0 items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {result.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {t(RESULT_KIND_LABEL_KEYS[result.kind])}
                      </span>
                    </span>
                    {result.subtitle ? (
                      <span className="truncate text-xs text-muted">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
