"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GENERAL_RESUME_USER_INSTRUCTION_MAX } from "@/lib/general-resume-user-instruction";
import { formatThousandsSeparated } from "@/lib/helper";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SYNC_DEBOUNCE_MS = 250;

export type GeneralResumeUserInstructionFlushResult = {
  userInstruction: string;
};

type GeneralResumeUserInstructionPanelProps = {
  userInstruction: string;
  onUserInstructionChange: (userInstruction: string) => void;
  onRegisterFlush?: (
    flush: () => GeneralResumeUserInstructionFlushResult | null,
  ) => void;
};

export function GeneralResumeUserInstructionPanel({
  userInstruction,
  onUserInstructionChange,
  onRegisterFlush,
}: GeneralResumeUserInstructionPanelProps) {
  const t = useT();
  const [localValue, setLocalValue] = useState(userInstruction);
  const localRef = useRef(localValue);
  const focusedRef = useRef(false);
  const committedRef = useRef(userInstruction);

  localRef.current = localValue;

  useEffect(() => {
    committedRef.current = userInstruction;
    if (!focusedRef.current) {
      setLocalValue(userInstruction);
    }
  }, [userInstruction]);

  const commit = useCallback(
    (next: string, force = false) => {
      if (!force && next === committedRef.current) {
        return;
      }
      committedRef.current = next;
      onUserInstructionChange(next);
    },
    [onUserInstructionChange],
  );

  const debouncedCommit = useDebouncedCallback((next: string) => {
    commit(next);
  }, SYNC_DEBOUNCE_MS);

  const flushPending =
    useCallback((): GeneralResumeUserInstructionFlushResult | null => {
      debouncedCommit.cancel();
      const next = localRef.current;
      if (next === committedRef.current) {
        return null;
      }
      committedRef.current = next;
      return { userInstruction: next };
    }, [debouncedCommit]);

  useEffect(() => onRegisterFlush?.(flushPending), [flushPending, onRegisterFlush]);

  useEffect(
    () => () => {
      debouncedCommit.flush();
    },
    [debouncedCommit],
  );

  function setValueCapped(value: string) {
    const next = value.slice(0, GENERAL_RESUME_USER_INSTRUCTION_MAX);
    setLocalValue(next);
    debouncedCommit(next);
  }

  return (
    <label className="flex min-h-0 flex-1 flex-col gap-1 text-sm">
      <p className="shrink-0 text-xs text-muted">
        {t("resumeBuilder.combine.userInstructionHint")}
      </p>
      <div className="relative min-h-0 flex-1">
        <textarea
          value={localValue}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            debouncedCommit.flush();
            commit(localRef.current);
          }}
          onChange={(event) => setValueCapped(event.target.value)}
          maxLength={GENERAL_RESUME_USER_INSTRUCTION_MAX}
          placeholder={t("resumeBuilder.combine.userInstructionPlaceholder")}
          className="absolute inset-0 h-full w-full resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
      </div>
    </label>
  );
}

export function formatGeneralResumeUserInstructionCount(length: number): string {
  return `${formatThousandsSeparated(length)}/${formatThousandsSeparated(GENERAL_RESUME_USER_INSTRUCTION_MAX)}`;
}
