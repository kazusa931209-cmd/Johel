"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const CONTEXT_SYNC_DEBOUNCE_MS = 250;

export type CombineCompanyContextFlushResult = {
  companyId: string;
  patch: Partial<Pick<CombineCompanyEntry, "roleContext" | "keywordContext">>;
};

type CombineCompanyContextFieldsProps = {
  companyId: string;
  roleContext: string;
  keywordContext: string;
  cardsDisabled: boolean;
  onPatchEntry: (
    companyId: string,
    patch: Partial<Pick<CombineCompanyEntry, "roleContext" | "keywordContext">>,
  ) => void;
  onRegisterFlush: (
    flusher: () => CombineCompanyContextFlushResult | null,
  ) => () => void;
};

export function CombineCompanyContextFields({
  companyId,
  roleContext,
  keywordContext,
  cardsDisabled,
  onPatchEntry,
  onRegisterFlush,
}: CombineCompanyContextFieldsProps) {
  const t = useT();
  const [localRoleContext, setLocalRoleContext] = useState(roleContext);
  const [localKeywordContext, setLocalKeywordContext] = useState(keywordContext);
  const localRoleContextRef = useRef(localRoleContext);
  const localKeywordContextRef = useRef(localKeywordContext);
  const roleFocusedRef = useRef(false);
  const keywordFocusedRef = useRef(false);
  const committedRoleContextRef = useRef(roleContext);
  const committedKeywordContextRef = useRef(keywordContext);

  localRoleContextRef.current = localRoleContext;
  localKeywordContextRef.current = localKeywordContext;

  useEffect(() => {
    committedRoleContextRef.current = roleContext;
    if (!roleFocusedRef.current) {
      setLocalRoleContext(roleContext);
    }
  }, [roleContext]);

  useEffect(() => {
    committedKeywordContextRef.current = keywordContext;
    if (!keywordFocusedRef.current) {
      setLocalKeywordContext(keywordContext);
    }
  }, [keywordContext]);

  const commitContext = useCallback(
    (
      nextRoleContext: string,
      nextKeywordContext: string,
      force = false,
    ) => {
      const roleChanged =
        force || nextRoleContext !== committedRoleContextRef.current;
      const keywordChanged =
        force || nextKeywordContext !== committedKeywordContextRef.current;
      if (!roleChanged && !keywordChanged) {
        return;
      }

      const patch: Partial<
        Pick<CombineCompanyEntry, "roleContext" | "keywordContext">
      > = {};
      if (roleChanged) {
        patch.roleContext = nextRoleContext;
        committedRoleContextRef.current = nextRoleContext;
      }
      if (keywordChanged) {
        patch.keywordContext = nextKeywordContext;
        committedKeywordContextRef.current = nextKeywordContext;
      }
      onPatchEntry(companyId, patch);
    },
    [companyId, onPatchEntry],
  );

  const debouncedCommit = useDebouncedCallback(
    (nextRoleContext: string, nextKeywordContext: string) => {
      commitContext(nextRoleContext, nextKeywordContext);
    },
    CONTEXT_SYNC_DEBOUNCE_MS,
  );

  const flushPending = useCallback((): CombineCompanyContextFlushResult | null => {
    debouncedCommit.cancel();
    const nextRoleContext = localRoleContextRef.current;
    const nextKeywordContext = localKeywordContextRef.current;
    const roleChanged =
      nextRoleContext !== committedRoleContextRef.current;
    const keywordChanged =
      nextKeywordContext !== committedKeywordContextRef.current;
    if (!roleChanged && !keywordChanged) {
      return null;
    }

    const patch: Partial<
      Pick<CombineCompanyEntry, "roleContext" | "keywordContext">
    > = {};
    if (roleChanged) {
      patch.roleContext = nextRoleContext;
      committedRoleContextRef.current = nextRoleContext;
    }
    if (keywordChanged) {
      patch.keywordContext = nextKeywordContext;
      committedKeywordContextRef.current = nextKeywordContext;
    }
    return { companyId, patch };
  }, [companyId, debouncedCommit]);

  useEffect(() => onRegisterFlush(flushPending), [flushPending, onRegisterFlush]);

  useEffect(
    () => () => {
      debouncedCommit.flush();
    },
    [debouncedCommit],
  );

  function queueCommit(nextRoleContext: string, nextKeywordContext: string) {
    debouncedCommit(nextRoleContext, nextKeywordContext);
  }

  return (
    <>
      <label className="flex items-center gap-3 text-sm">
        <span className="w-36 shrink-0">
          {t("generate.combine.roleContext")}
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        </span>
        <input
          type="text"
          value={localRoleContext}
          disabled={cardsDisabled}
          onFocus={() => {
            roleFocusedRef.current = true;
          }}
          onBlur={() => {
            roleFocusedRef.current = false;
            debouncedCommit.flush();
            commitContext(localRoleContextRef.current, localKeywordContextRef.current);
          }}
          onChange={(event) => {
            const nextRoleContext = event.target.value;
            setLocalRoleContext(nextRoleContext);
            queueCommit(nextRoleContext, localKeywordContextRef.current);
          }}
          placeholder={t("generate.combine.roleContextPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <span className="w-36 shrink-0">
          {t("generate.combine.keywordContext")}
        </span>
        <input
          type="text"
          value={localKeywordContext}
          disabled={cardsDisabled}
          onFocus={() => {
            keywordFocusedRef.current = true;
          }}
          onBlur={() => {
            keywordFocusedRef.current = false;
            debouncedCommit.flush();
            commitContext(localRoleContextRef.current, localKeywordContextRef.current);
          }}
          onChange={(event) => {
            const nextKeywordContext = event.target.value;
            setLocalKeywordContext(nextKeywordContext);
            queueCommit(localRoleContextRef.current, nextKeywordContext);
          }}
          placeholder={t("generate.combine.keywordContextPlaceholder")}
          title={t("generate.combine.keywordContextHint")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted disabled:cursor-not-allowed"
        />
      </label>
    </>
  );
}
