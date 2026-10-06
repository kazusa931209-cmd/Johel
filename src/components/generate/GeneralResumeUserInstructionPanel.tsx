"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GENERAL_RESUME_USER_INSTRUCTION_MAX } from "@/lib/general-resume-user-instruction";
import { GENERAL_RESUME_PLATFORM_MAX } from "@/lib/general-resume-platform";
import { formatThousandsSeparated } from "@/lib/helper";
import { loadGeneralResumePlatformSuggestions } from "@/lib/cached-settings";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SYNC_DEBOUNCE_MS = 250;

export type GeneralResumeUserInstructionFlushResult = {
  userInstruction: string;
  platform: string;
};

type GeneralResumeUserInstructionPanelProps = {
  userInstruction: string;
  platform: string;
  onUserInstructionChange: (userInstruction: string) => void;
  onPlatformChange: (platform: string) => void;
  onRegisterFlush?: (
    flush: () => GeneralResumeUserInstructionFlushResult | null,
  ) => void;
};

export function GeneralResumeUserInstructionPanel({
  userInstruction,
  platform,
  onUserInstructionChange,
  onPlatformChange,
  onRegisterFlush,
}: GeneralResumeUserInstructionPanelProps) {
  const t = useT();
  const platformListId = useId();
  const [platformSuggestions, setPlatformSuggestions] = useState<string[]>([]);

  const [localInstruction, setLocalInstruction] = useState(userInstruction);
  const instructionRef = useRef(localInstruction);
  const instructionFocusedRef = useRef(false);
  const committedInstructionRef = useRef(userInstruction);

  const [localPlatform, setLocalPlatform] = useState(platform);
  const platformRef = useRef(localPlatform);
  const platformFocusedRef = useRef(false);
  const committedPlatformRef = useRef(platform);

  instructionRef.current = localInstruction;
  platformRef.current = localPlatform;

  useEffect(() => {
    committedInstructionRef.current = userInstruction;
    if (!instructionFocusedRef.current) {
      setLocalInstruction(userInstruction);
    }
  }, [userInstruction]);

  useEffect(() => {
    committedPlatformRef.current = platform;
    if (!platformFocusedRef.current) {
      setLocalPlatform(platform);
    }
  }, [platform]);

  useEffect(() => {
    let cancelled = false;
    void loadGeneralResumePlatformSuggestions().then((res) => {
      if (cancelled || res.error || !res.data) return;
      setPlatformSuggestions(res.data.platforms);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commitInstruction = useCallback(
    (next: string, force = false) => {
      if (!force && next === committedInstructionRef.current) {
        return;
      }
      committedInstructionRef.current = next;
      onUserInstructionChange(next);
    },
    [onUserInstructionChange],
  );

  const commitPlatform = useCallback(
    (next: string, force = false) => {
      if (!force && next === committedPlatformRef.current) {
        return;
      }
      committedPlatformRef.current = next;
      onPlatformChange(next);
    },
    [onPlatformChange],
  );

  const debouncedCommitInstruction = useDebouncedCallback((next: string) => {
    commitInstruction(next);
  }, SYNC_DEBOUNCE_MS);

  const debouncedCommitPlatform = useDebouncedCallback((next: string) => {
    commitPlatform(next);
  }, SYNC_DEBOUNCE_MS);

  const flushPending =
    useCallback((): GeneralResumeUserInstructionFlushResult | null => {
      debouncedCommitInstruction.cancel();
      debouncedCommitPlatform.cancel();
      const nextInstruction = instructionRef.current;
      const nextPlatform = platformRef.current;
      const instructionChanged =
        nextInstruction !== committedInstructionRef.current;
      const platformChanged = nextPlatform !== committedPlatformRef.current;
      if (!instructionChanged && !platformChanged) {
        return null;
      }
      if (instructionChanged) {
        committedInstructionRef.current = nextInstruction;
      }
      if (platformChanged) {
        committedPlatformRef.current = nextPlatform;
      }
      return {
        userInstruction: nextInstruction,
        platform: nextPlatform,
      };
    }, [debouncedCommitInstruction, debouncedCommitPlatform]);

  useEffect(() => onRegisterFlush?.(flushPending), [flushPending, onRegisterFlush]);

  useEffect(
    () => () => {
      debouncedCommitInstruction.flush();
      debouncedCommitPlatform.flush();
    },
    [debouncedCommitInstruction, debouncedCommitPlatform],
  );

  function setInstructionCapped(value: string) {
    const next = value.slice(0, GENERAL_RESUME_USER_INSTRUCTION_MAX);
    setLocalInstruction(next);
    debouncedCommitInstruction(next);
  }

  function setPlatformCapped(value: string) {
    const next = value.slice(0, GENERAL_RESUME_PLATFORM_MAX);
    setLocalPlatform(next);
    debouncedCommitPlatform(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 text-sm">
      <label className="block shrink-0 space-y-1">
        <span>{t("resumeBuilder.combine.platformLabel")}</span>
        <input
          type="text"
          list={platformListId}
          value={localPlatform}
          onFocus={() => {
            platformFocusedRef.current = true;
          }}
          onBlur={() => {
            platformFocusedRef.current = false;
            debouncedCommitPlatform.flush();
            commitPlatform(platformRef.current);
          }}
          onChange={(event) => setPlatformCapped(event.target.value)}
          maxLength={GENERAL_RESUME_PLATFORM_MAX}
          placeholder={t("resumeBuilder.combine.platformPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono outline-none focus:border-muted"
        />
        <datalist id={platformListId}>
          {platformSuggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <p className="text-xs text-muted">
          {t("resumeBuilder.combine.platformHint")}
        </p>
      </label>

      <label className="flex min-h-0 flex-1 flex-col gap-1">
        <span>{t("resumeBuilder.combine.userInstructionFieldLabel")}</span>
        <p className="shrink-0 text-xs text-muted">
          {t("resumeBuilder.combine.userInstructionHint")}
        </p>
        <div className="relative min-h-0 flex-1">
          <textarea
            value={localInstruction}
            onFocus={() => {
              instructionFocusedRef.current = true;
            }}
            onBlur={() => {
              instructionFocusedRef.current = false;
              debouncedCommitInstruction.flush();
              commitInstruction(instructionRef.current);
            }}
            onChange={(event) => setInstructionCapped(event.target.value)}
            maxLength={GENERAL_RESUME_USER_INSTRUCTION_MAX}
            placeholder={t("resumeBuilder.combine.userInstructionPlaceholder")}
            className="absolute inset-0 h-full w-full resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
        </div>
      </label>
    </div>
  );
}

export function formatGeneralResumeUserInstructionCount(length: number): string {
  return `${formatThousandsSeparated(length)}/${formatThousandsSeparated(GENERAL_RESUME_USER_INSTRUCTION_MAX)}`;
}
