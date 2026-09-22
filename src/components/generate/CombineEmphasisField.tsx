"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const EMPHASIS_SYNC_DEBOUNCE_MS = 250;

export type CombineEmphasisFlushResult = {
  emphasis: string;
};

type CombineEmphasisFieldProps = {
  emphasis: string;
  onEmphasisChange: (emphasis: string) => void;
  onRegisterFlush?: (flush: () => CombineEmphasisFlushResult | null) => void;
};

export function CombineEmphasisField({
  emphasis,
  onEmphasisChange,
  onRegisterFlush,
}: CombineEmphasisFieldProps) {
  const t = useT();
  const [localEmphasis, setLocalEmphasis] = useState(emphasis);
  const localEmphasisRef = useRef(localEmphasis);
  const focusedRef = useRef(false);
  const committedEmphasisRef = useRef(emphasis);

  localEmphasisRef.current = localEmphasis;

  useEffect(() => {
    committedEmphasisRef.current = emphasis;
    if (!focusedRef.current) {
      setLocalEmphasis(emphasis);
    }
  }, [emphasis]);

  const commitEmphasis = useCallback(
    (nextEmphasis: string, force = false) => {
      if (!force && nextEmphasis === committedEmphasisRef.current) {
        return;
      }
      committedEmphasisRef.current = nextEmphasis;
      onEmphasisChange(nextEmphasis);
    },
    [onEmphasisChange],
  );

  const debouncedCommit = useDebouncedCallback((nextEmphasis: string) => {
    commitEmphasis(nextEmphasis);
  }, EMPHASIS_SYNC_DEBOUNCE_MS);

  const flushPending = useCallback((): CombineEmphasisFlushResult | null => {
    debouncedCommit.cancel();
    const nextEmphasis = localEmphasisRef.current;
    if (nextEmphasis === committedEmphasisRef.current) {
      return null;
    }
    committedEmphasisRef.current = nextEmphasis;
    return { emphasis: nextEmphasis };
  }, [debouncedCommit]);

  useEffect(() => onRegisterFlush?.(flushPending), [flushPending, onRegisterFlush]);

  useEffect(
    () => () => {
      debouncedCommit.flush();
    },
    [debouncedCommit],
  );

  return (
    <label className="block space-y-1 text-sm">
      <span>{t("generate.combine.emphasis")}</span>
      <p className="text-xs text-muted">{t("generate.combine.emphasisHint")}</p>
      <textarea
        value={localEmphasis}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          debouncedCommit.flush();
          commitEmphasis(localEmphasisRef.current);
        }}
        onChange={(event) => {
          const nextEmphasis = event.target.value;
          setLocalEmphasis(nextEmphasis);
          debouncedCommit(nextEmphasis);
        }}
        rows={4}
        placeholder={t("generate.combine.emphasisPlaceholder")}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
      />
    </label>
  );
}
